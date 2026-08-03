const q = encodeURIComponent('*[_type in ["shoe", "clearanceSale"] && (name match "*test*" || brand match "*test*" || tag match "*test*")]{_id, name}');
fetch('https://kxnjofhp.api.sanity.io/v2024-01-01/data/query/production?query=' + q)
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
