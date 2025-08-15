export default async function decorate(block) {
  const aempublishurl = 'https://publish-p14733-e1160558.adobeaemcloud.com';
  const aemauthorurl = 'https://author-p14733-e1160558.adobeaemcloud.com';

  const persistedquery = '/graphql/execute.json/ag-eds-site-4/ArticleByPath';
  const articlepath = block.querySelector(':scope div:nth-child(1) > div a').innerHTML.trim();
  let variationname = block.querySelector(':scope div:nth-child(2) > div > p').innerHTML.trim();
  if (!variationname) {
    variationname = 'main';
  }

  const url = window.location && window.location.origin && window.location.origin.includes('author')
    ? `${aemauthorurl}${persistedquery};path=${articlepath};variation=${variationname};ts=${Math.random() * 1000}`
    : `${aempublishurl}${persistedquery};path=${articlepath};variation=${variationname};ts=${Math.random() * 1000}`;
  const options = { credentials: 'include' };

  const cfReq = await fetch(url, options)
    .then((response) => response.json())
    .then((contentfragment) => {
      let path = '';
      if (contentfragment.data) {
        path = contentfragment.data.articleCfModelByPath.item;
      }
      return path;
    });

  const itemId = `urn:aemconnection:${articlepath}/jcr:content/data/master`;

  block.innerHTML = `
  <div class='article-content' data-aue-resource=${itemId} data-aue-label="Article Content Fragment" data-aue-type="reference" data-aue-filter="cf">
      <div>
          <h4 data-aue-prop="title" data-aue-label="title" data-aue-type="text" class='title'>${cfReq.title}</h4>
          <p data-aue-prop="content" data-aue-label="content" data-aue-type="text" class='content'>${cfReq.content.plaintext}</p>
      </div>
  </div>
`;
}
