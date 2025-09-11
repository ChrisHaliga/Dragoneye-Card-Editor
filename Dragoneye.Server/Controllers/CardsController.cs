using Microsoft.AspNetCore.Mvc;
using Dragoneye.Server.Models;

namespace Dragoneye.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CardsController : ControllerBase
    {
        private static readonly List<ElementData> Elements = new()
        {
            new() { Key = "pyr", Name = "Pyro", Symbol = "🔥", ImagePath = "/pyr.png" },
            new() { Key = "hyd", Name = "Hydro", Symbol = "💧", ImagePath = "/hyd.png" },
            new() { Key = "geo", Name = "Geo", Symbol = "🌍", ImagePath = "/geo.png" },
            new() { Key = "aer", Name = "Aero", Symbol = "🌪", ImagePath = "/aer.png" },
            new() { Key = "nyx", Name = "Nyx", Symbol = "🌑", ImagePath = "/nyx.png" },
            new() { Key = "lux", Name = "Lux", Symbol = "☀️", ImagePath = "/lux.png" },
            new() { Key = "arc", Name = "Arcane", Symbol = "⚡", ImagePath = "/arc.png" }
        };

        // In-memory storage for multiple card files
        private static Dictionary<string, CardData> SavedFiles = new()
        {
            ["my-card-set.json"] = new CardData
            {
                Filename = "my-card-set.json",
                Groups = new List<CardGroup>
                {
                    new()
                    {
                        Name = "Fire Cards",
                        Expanded = true,
                        Cards = new List<Card>
                        {
                            new()
                            {
                                Title = "Flame Strike",
                                Type = "Spell",
                                Elements = new List<string> { "pyr" },
                                BackgroundImage = "https://pbs.twimg.com/media/EFE7BgOVAAAYQoN.jpg",
                                Details = new List<CardDetail>
                                {
                                    new() { Name = "Attack", Details = "Deal 3 damage to target enemy", ApCost = 2, SpCost = 1 },
                                    new() { Name = "Burn", Details = "Target burns for 2 turns", ApCost = 1, SpCost = 2 }
                                }
                            },
                            new()
                            {
                                Title = "Fireball",
                                Type = "Spell",
                                Elements = new List<string> { "pyr", "arc" },
                                BackgroundImage = "https://i.redd.it/g2aexsgugxn31.jpg",
                                Details = new List<CardDetail>
                                {
                                    new() { Name = "Spell", Details = "Deal 2 damage to all enemies", ApCost = 3, SpCost = 2 }
                                }
                            }
                        }
                    },
                    new()
                    {
                        Name = "Water Cards",
                        Expanded = false,
                        Cards = new List<Card>
                        {
                            new()
                            {
                                Title = "Healing Wave",
                                Type = "Spell",
                                Elements = new List<string> { "hyd", "lux" },
                                BackgroundImage = "https://yourturndad.com/wp-content/uploads/2019/02/cure-wounds-1.jpg",
                                Details = new List<CardDetail>
                                {
                                    new() { Name = "Heal", Details = "Restore 5 HP to target ally", ApCost = 1, SpCost = 3 }
                                }
                            }
                        }
                    }
                }
            }
        };

        private static string CurrentFileName = "my-card-set.json";

        [HttpGet]
        public ActionResult<CardData> GetCardData()
        {
            if (SavedFiles.TryGetValue(CurrentFileName, out var data))
            {
                return Ok(data);
            }
            return NotFound();
        }

        [HttpGet("{filename}")]
        public ActionResult<CardData> GetCardDataByFilename(string filename)
        {
            if (SavedFiles.TryGetValue(filename, out var data))
            {
                CurrentFileName = filename;
                return Ok(data);
            }
            return NotFound();
        }

        [HttpGet("files")]
        public ActionResult<List<string>> GetAllFiles()
        {
            return Ok(SavedFiles.Keys.ToList());
        }

        [HttpPost]
        public ActionResult<CardData> SaveCardData([FromBody] CardData cardData)
        {
            var filename = string.IsNullOrEmpty(cardData.Filename) ? "card-set.json" : cardData.Filename;
            cardData.Filename = filename;
            SavedFiles[filename] = cardData;
            CurrentFileName = filename;
            return Ok(cardData);
        }

        [HttpGet("exists/{filename}")]
        public ActionResult<bool> FileExists(string filename)
        {
            return Ok(SavedFiles.ContainsKey(filename));
        }

        [HttpPut]
        public ActionResult<CardData> UpdateCardData([FromBody] CardData cardData)
        {
            SavedFiles[CurrentFileName] = cardData;
            return Ok(cardData);
        }

        [HttpDelete("{filename}")]
        public ActionResult DeleteCardData(string filename)
        {
            if (SavedFiles.Remove(filename))
            {
                if (CurrentFileName == filename && SavedFiles.Any())
                {
                    CurrentFileName = SavedFiles.Keys.First();
                }
                return Ok();
            }
            return NotFound();
        }

        [HttpGet("elements")]
        public ActionResult<List<ElementData>> GetElements()
        {
            return Ok(Elements);
        }
    }
}