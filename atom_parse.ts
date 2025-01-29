// Types for Atom feed structure
interface AtomFeed {
  title: string;
  subtitle?: string;
  updated: Date;
  id: string;
  links: AtomLink[];
  entries: AtomEntry[];
}

interface AtomEntry {
  title: string;
  id: string;
  updated: Date;
  published?: Date;
  content: string;
  summary?: string;
  author?: AtomPerson;
  links: AtomLink[];
}

interface AtomLink {
  href: string;
  rel?: string;
  type?: string;
  title?: string;
}

interface AtomPerson {
  name: string;
  email?: string;
  uri?: string;
}

async function parseAtomFeed(url: string): Promise<AtomFeed> {
  try {
    // Fetch the feed
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();

    // Parse XML
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');

    // Check for parsing errors
    const parseError = xml.querySelector('parsererror');
    if (parseError) {
      throw new Error('Failed to parse XML');
    }

    // Parse feed
    const feedElement = xml.querySelector('feed');
    if (!feedElement) {
      throw new Error('No feed element found');
    }

    // Helper function to get text content safely
    const getTextContent = (element: Element | null): string => 
      element?.textContent?.trim() || '';

    // Helper function to parse date
    const parseDate = (dateStr: string): Date => new Date(dateStr);

    // Parse links
    const parseLinks = (parent: Element): AtomLink[] => {
      return Array.from(parent.querySelectorAll('link')).map(link => ({
        href: link.getAttribute('href') || '',
        rel: link.getAttribute('rel') || undefined,
        type: link.getAttribute('type') || undefined,
        title: link.getAttribute('title') || undefined,
      }));
    };

    // Parse author
    const parseAuthor = (parent: Element): AtomPerson | undefined => {
      const authorElement = parent.querySelector('author');
      if (!authorElement) return undefined;

      return {
        name: getTextContent(authorElement.querySelector('name')),
        email: getTextContent(authorElement.querySelector('email')),
        uri: getTextContent(authorElement.querySelector('uri')),
      };
    };

    // Parse entries
    const entries: AtomEntry[] = Array.from(xml.querySelectorAll('entry')).map(entry => ({
      title: getTextContent(entry.querySelector('title')),
      id: getTextContent(entry.querySelector('id')),
      updated: parseDate(getTextContent(entry.querySelector('updated'))),
      published: entry.querySelector('published') 
        ? parseDate(getTextContent(entry.querySelector('published')))
        : undefined,
      content: getTextContent(entry.querySelector('content')),
      summary: getTextContent(entry.querySelector('summary')),
      author: parseAuthor(entry),
      links: parseLinks(entry),
    }));

    // Construct and return the feed object
    const feed: AtomFeed = {
      title: getTextContent(feedElement.querySelector('title')),
      subtitle: getTextContent(feedElement.querySelector('subtitle')),
      updated: parseDate(getTextContent(feedElement.querySelector('updated'))),
      id: getTextContent(feedElement.querySelector('id')),
      links: parseLinks(feedElement),
      entries,
    };

    return feed;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Atom feed: ${error.message}`);
    }
    throw new Error('Failed to parse Atom feed');
  }
}

// Example usage
async function example() {
  try {
    const feed = await parseAtomFeed('https://example.com/feed.atom');
    console.log('Feed title:', feed.title);
    console.log('Number of entries:', feed.entries.length);
    
    // Process entries
    feed.entries.forEach(entry => {
      console.log('\nEntry:', entry.title);
      console.log('Published:', entry.published);
      console.log('Content:', entry.content.substring(0, 100) + '...');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}
// Made with Claude

