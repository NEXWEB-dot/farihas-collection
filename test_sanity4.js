const query = 'red espadrilles';
const q = encodeURIComponent(`*[_type in ["shoe", "clearanceSale"] && (name match "*${query}*" || brand match "*${query}*" || tag match "*${query}*")]{_id, name, brand, tag}[0...5]`);
fetch('https://kxnjofhp.api.sanity.io/v2024-01-01/data/query/production?query=' + q)
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
