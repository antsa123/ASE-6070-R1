using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using CsvHelper;

namespace DataGetterOnline
{
    class Program
    {
        static void Main(string[] args)
        {
            string baseUrl = "http://space.fmi.fi/image/plasmon/NUR/";

            // HUOM! En ota mitään vastuuta jos joku saa tällä ddos hyökkäys syytöksiä!!
            // Tekee siis niin monta http get:ä Fmi:n suuntaan kun näiden päivän välissä on päiviä
            var startDate = new DateTime(2013, 1, 1);
            var endDate = new DateTime(2013, 1, 3);

            var dataAsList = new List<DataItem>();
            Console.WriteLine("Making API Calls...");
            using (var client = new HttpClient(new HttpClientHandler{ AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate }))
            {
                client.BaseAddress = new Uri(baseUrl);
                while (startDate <= endDate)
                {
                    try
                    {
                        var getParam = "NUR_" + startDate.ToString("yyyyMMdd") + ".txt.gz";
                        Console.WriteLine("GET " + getParam);
                        HttpResponseMessage response = client.GetAsync(getParam).Result;
                        response.EnsureSuccessStatusCode();
                        var result = response.Content.ReadAsByteArrayAsync().Result;
                        var deCompressed = Decompress(result);
                        var dataAsString = System.Text.Encoding.Default.GetString(deCompressed);
                        ReadFile(dataAsString, dataAsList);
                        startDate = startDate.AddDays(1);
                    }
                    catch (HttpRequestException ex)
                    {
                        Console.WriteLine(ex);
                        startDate = startDate.AddDays(1);
                    }
                }
            }

            IEnumerable<DataItem> dataAsEnumerable = dataAsList;
            using (TextWriter writer = new StreamWriter(@"C:\temp\onlinetest.csv"))
            {
                var csv = new CsvWriter(writer);
                csv.Configuration.Encoding = Encoding.UTF8;
                csv.WriteRecords(dataAsEnumerable); // where values implements IEnumerable
            }
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

        static void ReadFile(string data, List<DataItem> dataAsList)
        {
            var lines = data.Split("\r\n".ToCharArray(), StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines)
            {
                var stringArray = line.Split(" ".ToCharArray(), StringSplitOptions.RemoveEmptyEntries);

                var date = new DateTime(Int32.Parse(stringArray[0]), Int32.Parse(stringArray[1]), Int32.Parse(stringArray[2]),
                    Int32.Parse(stringArray[3]), Int32.Parse(stringArray[4]), Int32.Parse(stringArray[5]));

                var magneticvalue = stringArray[6];

                dataAsList.Add(new DataItem()
                {
                    Date = date.ToString("yyyyMMdd-HHmmss"),
                    MagneticValue = magneticvalue
                });
            }
        }

        public class DataItem
        {
            public string Date { get; set; }

            public string MagneticValue { get; set; }
        }

    }
}
