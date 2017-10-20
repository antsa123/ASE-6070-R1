using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using CsvHelper;
using System.Reflection;
using System.Runtime.InteropServices;

namespace OfflineDataGetter
{

    class Program
    {
        static void Main(string[] args)
        {
            string path = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), "data");

            string[] files = Directory.GetFiles(path);
            Object o = new Object();

            var dataAsList = new List<DataItem>();
            Console.WriteLine("Found " + files.Length + " from directory.");
            Console.WriteLine("Started reading files...");
            int counter = 0;
            Parallel.ForEach(files, (filename) =>
            {
                var file = File.ReadAllBytes(filename);
                // Decompress file if file name ends as that
                if (filename.Substring(filename.Length - 3) == ".gz")
                {
                    file = Decompress(file);
                }
                else
                {
                    //Console.WriteLine("Note: read uncompressed file " + filename);
                }
                var dataAsString = System.Text.Encoding.Default.GetString(file);
                ReadFile(dataAsString, dataAsList, filename, o);
                ++counter;
                if (counter % 200 == 0)
                {
                    Console.WriteLine(counter + " files read...");
                }
            });

            //IEnumerable<DataItemString> dataAsEnumerable = GetMinuteValueIEnumerable(dataAsList);
            //IEnumerable<DataItemString> dataAsEnumerable = GetHourlyAveragesIEnumerable(dataAsList);
            // IEnumerable<DataItemString> dataAsEnumerable = GetHourlyDetivateIEnumerable(dataAsList);
            //IEnumerable<DataItemString> dataAsEnumerable = GetHourlyMaxDetivateIEnumerable(dataAsList);
            IEnumerable<SigleValueString> dataAsEnumerable = GetHourlyMaxSingleDetivateIEnumerable(dataAsList);

            Console.WriteLine("All files read. Starting to create csv file.");
            using (TextWriter writer = new StreamWriter(@"C:\temp\offilentest.csv"))
            {
                var csv = new CsvWriter(writer);
                csv.Configuration.Encoding = Encoding.UTF8;
                csv.WriteRecords(dataAsEnumerable); // where values implements IEnumerable
            }
            Console.WriteLine("Csv file saved! I'am done!");
            Console.ReadLine();
        }

        static byte[] Decompress(byte[] gzip)
        {
            // Create a GZIP stream with decompression mode.
            // ... Then create a buffer and write into while reading from the GZIP stream.
            using (GZipStream stream = new GZipStream(new MemoryStream(gzip),
                CompressionMode.Decompress))
            {
                const int size = 4096;
                byte[] buffer = new byte[size];
                using (MemoryStream memory = new MemoryStream())
                {
                    int count = 0;
                    do
                    {
                        count = stream.Read(buffer, 0, size);
                        if (count > 0)
                        {
                            memory.Write(buffer, 0, count);
                        }
                    } while (count > 0);
                    return memory.ToArray();
                }
            }
        }

        static void ReadFile(string data, List<DataItem> dataAsList, string fileName, Object o)
        {
            var invalidValues = new List<double>() { 88888.80, 99999.00 , 999.99 };
            var lines = data.Split("\r\n".ToCharArray(), StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines)
            {
                var stringArray = line.Split(" ".ToCharArray(), StringSplitOptions.RemoveEmptyEntries);
                var dateString = stringArray[0] + " " + stringArray[1];

                // Skip comments lines at the begining
                if (stringArray[0] == "#" || line.EndsWith("|"))
                {
                    continue;
                }

                // Without proper date, data is not very useful, skip file
                if (!DateTime.TryParse(dateString, out DateTime date))
                {
                    Console.WriteLine("DateTime parse failed at file" + fileName);
                    return;
                }

                var magneticvalueX = double.Parse(stringArray[3], CultureInfo.InvariantCulture);
                var magneticvalueY = double.Parse(stringArray[4], CultureInfo.InvariantCulture);
                var magneticvalueZ = double.Parse(stringArray[5], CultureInfo.InvariantCulture);
                var magneticvalueF = double.Parse(stringArray[6], CultureInfo.InvariantCulture);

                // Validate data
                if (invalidValues.Contains(magneticvalueX)
                    || invalidValues.Contains(magneticvalueY)
                    || magneticvalueY < 0
                    || magneticvalueX < 0)
                {
                    magneticvalueX = double.NaN;
                    magneticvalueY = double.NaN;
                    magneticvalueZ = double.NaN;
                    magneticvalueF = double.NaN;
                }

                lock (o) {
                    dataAsList.Add(new DataItem()
                    {
                        Date = date,
                        MagneticValueX = magneticvalueX,
                        MagneticValueY = magneticvalueY,
                        MagneticValueZ = magneticvalueZ,
                        MagneticValueF = magneticvalueF
                    });
                }
            }
        }

        static IEnumerable<DataItemString> GetMinuteValueIEnumerable(IEnumerable<DataItem> dataAsList)
        {
            var minuteValues = dataAsList.Select(i => (new DataItemString
            {
                Date = new DateTime(i.Date.Year, i.Date.Month, i.Date.Day, i.Date.Hour, i.Date.Minute, 0).ToString("yyyyMMdd-HHmm"),
                MagneticValueX = i.MagneticValueX.ToString("0.00", CultureInfo.InvariantCulture),
                MagneticValueY = i.MagneticValueY.ToString("0.00", CultureInfo.InvariantCulture),
                MagneticValueZ = i.MagneticValueZ.ToString("0.00", CultureInfo.InvariantCulture),
                MagneticValueF = i.MagneticValueF.ToString("0.00", CultureInfo.InvariantCulture)
            }));
            minuteValues = minuteValues.OrderBy(n => n.Date);
            return minuteValues;
        }

        static IEnumerable<DataItemString> GetHourlyAveragesIEnumerable(IEnumerable<DataItem> dataAsList)
        {
            // Calculates average to for every hour
            // ~TODO final magnetic value will be NaN is even single value in that hour is Nan
            var hourlyAverages = dataAsList.GroupBy(n => new { n.Date.Year, n.Date.Month, n.Date.Day, n.Date.Hour })
                .Select(i => (new DataItemString
                {
                    Date = new DateTime(i.Key.Year, i.Key.Month, i.Key.Day, i.Key.Hour, 0, 0).ToString("yyyyMMdd-HH"),
                    MagneticValueX = i.Average(k => k.MagneticValueX).ToString("0.00", CultureInfo.InvariantCulture),
                    MagneticValueY = i.Average(k => k.MagneticValueY).ToString("0.00", CultureInfo.InvariantCulture),
                    MagneticValueZ = i.Average(k => k.MagneticValueZ).ToString("0.00", CultureInfo.InvariantCulture),
                    MagneticValueF = i.Average(k => k.MagneticValueF).ToString("0.00", CultureInfo.InvariantCulture)
                }));
            hourlyAverages = hourlyAverages.OrderBy(n => n.Date);
            return hourlyAverages;
        }

        static IEnumerable<DataItemString> GetHourlyDetivateIEnumerable(IEnumerable<DataItem> dataAsList)
        {
            var hourlyAverages = dataAsList.GroupBy(n => new { n.Date.Year, n.Date.Month, n.Date.Day, n.Date.Hour })
                .Select(i => (new DataItem
                {
                    Date = new DateTime(i.Key.Year, i.Key.Month, i.Key.Day, i.Key.Hour, 0, 0),
                    MagneticValueX = i.Average(k => k.MagneticValueX),
                    MagneticValueY = i.Average(k => k.MagneticValueY),
                    MagneticValueZ = i.Average(k => k.MagneticValueZ),
                    MagneticValueF = i.Average(k => k.MagneticValueF)
                }));

            hourlyAverages = hourlyAverages.OrderBy(n => n.Date);

            var derivatesDataItems = new List<DataItem>();
            int j = 0;
            DataItem previousDataItem = new DataItem();
            foreach (var value in hourlyAverages)
            {
                if (j == 0)
                {
                    previousDataItem = value;
                    ++j;
                    continue;
                }

                derivatesDataItems.Add(new DataItem
                {
                    Date = previousDataItem.Date,
                    MagneticValueX = Math.Abs(previousDataItem.MagneticValueX - value.MagneticValueX),
                    MagneticValueY = Math.Abs(previousDataItem.MagneticValueY - value.MagneticValueY),
                    MagneticValueZ = Math.Abs(previousDataItem.MagneticValueZ - value.MagneticValueZ),
                    MagneticValueF = Math.Abs(previousDataItem.MagneticValueF - value.MagneticValueF),
                });
                previousDataItem = value;
                ++j;
            }

            var derivatesDataItemStrings = derivatesDataItems.Select(i => (new DataItemString
            {
                Date = new DateTime(i.Date.Year, i.Date.Month, i.Date.Day, i.Date.Hour, i.Date.Minute, 0).ToString("yyyyMMdd-HHmm"),
                MagneticValueX = i.MagneticValueX.ToString("0.00", CultureInfo.InvariantCulture),
                MagneticValueY = i.MagneticValueY.ToString("0.00", CultureInfo.InvariantCulture),
                MagneticValueZ = i.MagneticValueZ.ToString("0.00", CultureInfo.InvariantCulture),
                MagneticValueF = i.MagneticValueF.ToString("0.00", CultureInfo.InvariantCulture)
            }));

            return derivatesDataItemStrings;
        }

        static IEnumerable<DataItemString> GetHourlyMaxDetivateIEnumerable(IEnumerable<DataItem> dataAsList)
        {
            var maxDifferenceInHour = dataAsList.GroupBy(n => new { n.Date.Year, n.Date.Month, n.Date.Day, n.Date.Hour })
                .Select(i => new DataItem
                {
                    Date = new DateTime(i.Key.Year, i.Key.Month, i.Key.Day, i.Key.Hour, 0, 0),
                    MagneticValueX = i.Max(k => k.MagneticValueX) - i.Select(k => k.MagneticValueX).Where(j => !double.IsNaN(j)).DefaultIfEmpty().Min(),
                    MagneticValueY = i.Max(k => k.MagneticValueY) - i.Select(k => k.MagneticValueY).Where(j => !double.IsNaN(j)).DefaultIfEmpty().Min(),
                    MagneticValueZ = i.Max(k => k.MagneticValueZ) - i.Select(k => k.MagneticValueZ).Where(j => !double.IsNaN(j)).DefaultIfEmpty().Min(),
                    MagneticValueF = i.Max(k => k.MagneticValueF) - i.Select(k => k.MagneticValueF).Where(j => !double.IsNaN(j)).DefaultIfEmpty().Min()
                });

            maxDifferenceInHour = maxDifferenceInHour.OrderBy(n => n.Date);

            var derivatesDataItemStrings = maxDifferenceInHour.Select(i => (new DataItemString
            {
                Date = new DateTime(i.Date.Year, i.Date.Month, i.Date.Day, i.Date.Hour, i.Date.Minute, 0).ToString("yyyyMMdd-HHmm"),
                MagneticValueX = i.MagneticValueX.ToString("0.00", CultureInfo.InvariantCulture),
                MagneticValueY = i.MagneticValueY.ToString("0.00", CultureInfo.InvariantCulture),
                MagneticValueZ = i.MagneticValueZ.ToString("0.00", CultureInfo.InvariantCulture),
                MagneticValueF = i.MagneticValueF.ToString("0.00", CultureInfo.InvariantCulture)
            }));

            return derivatesDataItemStrings;
        }

        static IEnumerable<SigleValueString> GetHourlyMaxSingleDetivateIEnumerable(IEnumerable<DataItem> dataAsList)
        {
            var maxDifferenceInHour = dataAsList.GroupBy(n => new { n.Date.Year, n.Date.Month, n.Date.Day, n.Date.Hour })
                .Select(i => new DataItem
                {
                    Date = new DateTime(i.Key.Year, i.Key.Month, i.Key.Day, i.Key.Hour, 0, 0),
                    MagneticValueX = i.Max(k => k.MagneticValueX) - i.Select(k => k.MagneticValueX).Where(j => !double.IsNaN(j)).DefaultIfEmpty().Min(),
                    MagneticValueY = i.Max(k => k.MagneticValueY) - i.Select(k => k.MagneticValueY).Where(j => !double.IsNaN(j)).DefaultIfEmpty().Min(),
                    MagneticValueZ = i.Max(k => k.MagneticValueZ) - i.Select(k => k.MagneticValueZ).Where(j => !double.IsNaN(j)).DefaultIfEmpty().Min(),
                    MagneticValueF = i.Max(k => k.MagneticValueF) - i.Select(k => k.MagneticValueF).Where(j => !double.IsNaN(j)).DefaultIfEmpty().Min()
                });

            maxDifferenceInHour = maxDifferenceInHour.OrderBy(n => n.Date);


            var singleDataValues = maxDifferenceInHour.Select(i => new SigleValue
            {
                Date = i.Date,
                MagneticValue = new double[] { i.MagneticValueX, i.MagneticValueY }.Max()
            });


            var derivatesDataItemStrings = maxDifferenceInHour.Select(i => new SigleValueString
            {
                Date = new DateTime(i.Date.Year, i.Date.Month, i.Date.Day, i.Date.Hour, i.Date.Minute, 0).ToString("yyyyMMdd-HHmm"),
                MagneticValue = i.MagneticValueX.ToString("0.00", CultureInfo.InvariantCulture),
            });

            return derivatesDataItemStrings;
        }

        public class DataItem
        {
            public DateTime Date { get; set; }

            public double MagneticValueX { get; set; }

            public double MagneticValueY { get; set; }

            public double MagneticValueZ { get; set; }

            public double MagneticValueF { get; set; }
        }

        public class DataItemString
        {
            public string Date { get; set; }

            public string MagneticValueX { get; set; }

            public string MagneticValueY { get; set; }

            public string MagneticValueZ { get; set; }

            public string MagneticValueF { get; set; }
        }

        public class SigleValue
        {
            public DateTime Date { get; set; }
            public double MagneticValue { get; set; }
        }

        public class SigleValueString
        {
            public string Date { get; set; }
            public string MagneticValue { get; set; }
        }
    }
}