# real-estate-prices

Source real estate prices from public sources.

## Schema

- `crawl_id` - The Common Crawl this comes from, e.g. `CC-MAIN-2017-22`
- `warc_url` - The WARC path, e.g. `s3://commoncrawl/crawl-data/CC-MAIN-2018-30/segments/1531676588961.14/warc/CC-MAIN-20180715183800-20180715203800-00037.warc.gz`
- `warc_record_id` - The WARC record id, e.g. `urn:uuid:a04218d3-a49e-4fde-8c2e-16379cfa28c6`
- `url` - The URL, e.g. `http://563463.hudsonriverproperties.com/blog/Best+Deals+Of+The+Year`
- `domain` - The domain, e.g. `563463.hudsonriverproperties.com`
- `index` - The index of this record (eg if the page has multiple listings), starting at `0`
- `external_id` - Optional, the external identifier
- `country` - ISO-3166-2 code for the country, eg `US`
- `address` - Street address, eg `704 SAND CREEK CIR`
- `city` - City, eg `Weston`
- `state` - State, eg `FL`
- `postal_code` - Optional, Postal code, eg `33327`
- `warc_date` - Date page was crawled
- `listing_date` - Date listing was created, if known
- `page_date` - Date page was authored, if known
- `sold_date` - Date listing was sold, if known
- `price` - Listing price, in $
- `sold_price` - Sale price, in $, if known
- `beds` - # of bedrooms
- `baths` - # of baths
- `half_baths` - # of half baths
- `sqft` - Floor space in sqft
- `lot_size` - Lot size in acres
- `lat` - Latitude
- `lng` - Longitude
- `year_built` - Year built (eg `1990`)

## Use

The system is designed to be run interactively in a browser while debugging. When you're ready to crawl at scale,
the built-up rules are run in a server-side javascript environment.

### Development

1. run `./server`
2. navigate to `javascript:(function(){var s=document.createElement('div');s.innerHTML='Loading...';s.style.color='black';s.style.padding='20px';s.style.position='fixed';s.style.zIndex='9999';s.style.fontSize='3.0em';s.style.border='2px solid black';s.style.right='40px';s.style.top='40px';s.setAttribute('class','selector_gadget_loading');s.style.background='white';document.body.appendChild(s);s=document.createElement('script');s.setAttribute('type','text/javascript');s.setAttribute('src','http://localhost:8000/js/bootstrap.js?' + (new Date()).getTime());document.body.appendChild(s);})();`
3. check your console

#### Getting data to test on

1. Get a WARC path file: http://commoncrawl.org/the-data/get-started/
2. Download a random file
3. `pipenv shell`
4. `./filter.sh warcfile.gz`
5. `rm -rf stripped && mkdir stripped && ./export.py tmp stripped`
6. There are file in `stripped/`

### Tests

#### Unit tests

```
cd js
yarn test
```

#### E2E tests

```
cd js
yarn test-e2e
```
