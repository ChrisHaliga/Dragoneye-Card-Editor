namespace Dragoneye.Server.Models
{
    public class CardDetail
    {
        public string Name { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public int ApCost { get; set; }
        public int SpCost { get; set; }
    }

    public class Card
    {
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Element { get; set; } = string.Empty;
        public string? BackgroundImage { get; set; }
        public List<CardDetail> Details { get; set; } = new();
    }

    public class CardGroup
    {
        public string Name { get; set; } = string.Empty;
        public List<Card> Cards { get; set; } = new();
        public bool Expanded { get; set; } = true;
    }

    public class CardData
    {
        public string Filename { get; set; } = string.Empty;
        public List<CardGroup> Groups { get; set; } = new();
    }

    public class ElementData
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }
}