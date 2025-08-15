export default async function decorate(block) {
  const aempublishurl = 'https://publish-p14733-e1160558.adobeaemcloud.com';
  const aemauthorurl = 'https://author-p14733-e1160558.adobeaemcloud.com';
  const persistedquery = '/graphql/execute.json/ag-eds-site-4/OfferByPath';
  const offerpath = block.querySelector(':scope div:nth-child(1) > div a').innerHTML.trim();
  let variationname = block.querySelector(':scope div:nth-child(2) > div > p').innerHTML.trim();

  if (!variationname) {
    variationname = 'main';
  }

  const url = window.location && window.location.origin && window.location.origin.includes('author')
    ? `${aemauthorurl}${persistedquery};path=${offerpath};variation=${variationname};ts=${Math.random() * 1000}`
    : `${aempublishurl}${persistedquery};path=${offerpath};variation=${variationname};ts=${Math.random() * 1000}`;
  const options = { credentials: 'include' };

  const cfReq = await fetch(url, options)
    .then((response) => response.json())
    .then((contentfragment) => {
      let offer = '';
      if (contentfragment.data) {
        offer = contentfragment.data.offerCfModelByPath.item;
      }
      return offer;
    });

  const itemId = `urn:aemconnection:${offerpath}/jcr:content/data/master`;

  block.innerHTML = `
  <div class='offer-content' data-aue-resource=${itemId} data-aue-label="Offer Content Fragment" data-aue-type="reference" data-aue-filter="cf">
      <div class='offer-left'>
          <h4 data-aue-prop="title" data-aue-label="Title" data-aue-type="text" class='title'>${cfReq.title}</h4>
          <p data-aue-prop="content" data-aue-label="Content" data-aue-type="text" class='content'>${cfReq.content.plaintext}</p>
      </div>
      <div class='offer-right'>
         <a href="${cfReq.ctaUrl}" data-aue-prop="callToAction" data-aue-label="Call to Action" data-aue-type="text" class='button secondary'>${cfReq.callToAction}</a>
      </div>
  </div>
`;
}
