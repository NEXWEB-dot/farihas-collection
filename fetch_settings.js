const projectId = 'kxnjofhp';
const dataset = 'production';
const apiVersion = '2024-01-01';

const query = `*[_type == "siteSettings"][0]`;
const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;

fetch(url)
  .then(res => res.json())
  .then(json => console.log(JSON.stringify(json.result, null, 2)))
  .catch(err => console.error(err));
