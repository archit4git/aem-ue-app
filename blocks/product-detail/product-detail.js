import {
  getProducts, art, money, addToCart, trackCommerce,
} from '../../scripts/commerce.js';

export default async function decorate(block) {
  const sku = new URLSearchParams(window.location.search).get('sku');
  const products = await getProducts();
  const p = products.find((x) => x.sku === sku);

  if (!p) {
    block.innerHTML = '<p>That product is not in the catalog. <a href="/">Back to the shop</a></p>';
    return;
  }
  document.title = `${p.name} | Brewline`;

  block.innerHTML = `
    <img alt="" width="480" height="480">
    <div class="product-detail-info">
      <h1></h1>
      <p class="product-detail-price"></p>
      <p class="product-detail-blurb"></p>
      <button type="button" class="poc-button">Add to cart</button>
    </div>`;
  block.querySelector('img').src = art(p);
  block.querySelector('h1').textContent = p.name;
  block.querySelector('.product-detail-price').textContent = money(p.price);
  block.querySelector('.product-detail-blurb').textContent = p.blurb;
  const btn = block.querySelector('button');
  btn.addEventListener('click', () => {
    addToCart(p);
    btn.textContent = 'Added to cart';
  });

  trackCommerce('commerce.productViews', [{ ...p, qty: 1 }]);
}
