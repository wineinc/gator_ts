import { XMLParser } from "fast-xml-parser";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};


function isObject( value: any): value is RSSFeed {
  if (value === undefined || value === null || (typeof value !==  'object') || Array.isArray(value)) {
    return false;
  }

  return true;
}

function isRSSFeed( value: any): value is RSSFeed
{
    if (!isObject(value)) {
      return false;
    }

    if (!('channel' in value)) {
      return false;
    }

    if (! (
      ('title' in value.channel && typeof value.channel.title === 'string') &&
      ('link' in value.channel && typeof value.channel.link === 'string') &&
      ('description' in value.channel && typeof value.channel.description === 'string')
          )
      )
    {
      return false;
    }

    if (!('item' in value.channel) || !Array.isArray(value.channel.item)) {
      return false;
    }
  console.log(`isRSSFeed: checked out before RSSItem`);
    return value.channel.item.every((e) => isRSSItem(e));
}

function isRSSItem(value: any): value is RSSItem {
  if (!isObject(value)) {
    console.log(`isRSSItem: not an object`);
    return false;
  }

  console.log(`isRSSItem: before ret evaluation`);
  const ret = (
      ('title' in value && typeof value.title === 'string') &&
      ('link' in value && typeof value.link === 'string') &&
      ('description' in value && typeof value.description === 'string') &&
      ('pubDate' in value && typeof value.pubDate === 'string')
    );

  if (!ret) {
    console.log(`isRSSItem evaluated to false: ${JSON.stringify(value)}`);
  }
  return ret;
}

async function getXmlText(feedURL: string): Promise<string>
{
  try {
    const response = await fetch(feedURL, {
          method: "GET",
          headers: {
            "User-Agent": "gator",
          },
        });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    //console.log(`getXmlText: response was ok`);
    const text = await response.text();
    //console.log(`getXmlText: ${text}`);
    return text;

  } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`failed fetch at ${feedURL}: ${message}`, { cause: err });
  }

}


export async function fetchFeed(feedURL: string): Promise<RSSFeed>
{
  const xmlText = await getXmlText(feedURL);

  const xmlParser = new XMLParser({processEntities: false});
  const parsed = xmlParser.parse(xmlText).rss;
  console.log(`fetchFeed: ${JSON.stringify(parsed)}`);

  if (!isRSSFeed(parsed)) {
    throw new Error(`Not a valid RSSFeed. ParsedValue=${JSON.stringify(parsed)}`);
  }

  const items: RSSItem[] = [];
  for (const item of  parsed.channel.item) {
    if (!isRSSItem(item)) {
      continue;
    }
    let rec: Record<string, string> = {};

    rec['title'] = item.title;
    rec['link'] = item.link;
    rec['description'] = item.description;
    rec['pubDate'] = item.pubDate;

    items.push(rec as RSSItem);
  } // for item of parsed channel items

  return {
    channel: {
      title: parsed.channel.title,
      link: parsed.channel.link,
      description: parsed.channel.description,
      item: items
    }
  };
} // fetchFeed
