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

namespace OfflineDataGetter
{

    class Program
    {
        static void Main(string[] args)
        {
            string path = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), "data");

            // TODO: Sorting might be needed to get order right
            string[] files = Directory.GetFiles(path);

            var dataAsList = new List<DataItem>();
            Console.WriteLine("Found " + files.Length + " from directory.");
            Console.WriteLine("Started reading files...");
            int counter = 0;
            foreach (var filename in files)
            {
                var file = File.ReadAllBytes(filename);
                //Decompress file if file name ends as that
                if (filename.Substring(filename.Length - 3) == ".gz")
                {
                    file = Decompress(file);
                }
                else
                {
                    Console.WriteLine("Note: read uncompressed file " + filename);
                }
                var dataAsString = System.Text.Encoding.Default.GetString(file);
                ReadFile(dataAsString, dataAsList, filename);
                ++counter;
                if (counter % 200 == 0)
                {
                    Console.WriteLine(counter + " files read...");
                }
            }

            Console.WriteLine("All files read. Starting to create csv file.");
            IEnumerable<DataItem> dataAsEnumerable = dataAsList;

            using (TextWriter writer = new StreamWriter(@"C:\temp\onlinetest.csv"))
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

        static void ReadFile(string data, List<DataItem> dataAsList, string fileName)
        {
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
                
                // Without proper date data is not very useful, skip file
                if(!DateTime.TryParse(dateString, out DateTime date))
                {
                    Console.WriteLine("DateTime parse failed at file" + fileName);
                    return;
                }

                var magneticvalueX = stringArray[3];
                var magneticvalueY = stringArray[4];
                var magneticvalueZ = stringArray[5];
                var magneticvalueF = stringArray[6];

                dataAsList.Add(new DataItem()
                {
                    Date = date.ToString("yyyyMMdd-HHmmss"),
                    MagneticValueX = magneticvalueX,
                    MagneticValueY = magneticvalueY,
                    MagneticValueZ = magneticvalueZ,
                    MagneticValueF = magneticvalueF
                });
            }
        }
        public class DataItem
        {
            public string Date { get; set; }

            public string MagneticValueX { get; set; }

            public string MagneticValueY { get; set; }

            public string MagneticValueZ { get; set; }

            public string MagneticValueF { get; set; }
        }
    }
}