import {
  readCart, writeCart, money, purchase, trackCommerce,
} from '../../scripts/commerce.js';

function view(block) {
  const cart = readCart();
  if (!cart.length) {
    block.innerHTML = '<p class="cart-empty">Your cart is empty. <a href="/">Pick something to brew with.</a></p>';
    return;
  }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  block.innerHTML = `
    <table>
      <thead><tr><th scope="col">Item</th><th scope="col">Qty</th><th scope="col">Price</th><th><span class="visually-hidden">Remove</span></th></tr></thead>
      <tbody></tbody>
      <tfoot><tr><th scope="row" colspan="2">Total</th><td colspan="2"></td></tr></tfoot>
    </table>
    <button type="button" class="poc-button" data-action="checkout">Place order</button>`;
  block.querySelector('tfoot td').textContent = money(total);

  const body = block.querySelector('tbody');
  cart.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td></td>
      <td><input type="number" min="1" max="20" aria-label="Quantity"></td>
      <td></td>
      <td><button type="button" class="poc-button" data-variant="quiet">Remove</button></td>`;
    tr.children[0].textContent = item.name;
    tr.children[2].textContent = money(item.price * item.qty);
    const qty = tr.querySelector('input');
    qty.value = item.qty;
    qty.addEventListener('change', () => {
      item.qty = Math.max(1, Math.min(20, Number(qty.value) || 1));
      writeCart(cart);
    });
    tr.querySelector('button').addEventListener('click', () => {
      writeCart(cart.filter((i) => i.sku !== item.sku));
      trackCommerce('commerce.productListRemovals', [item]);
    });
    body.append(tr);
  });

  block.querySelector('[data-action="checkout"]').addEventListener('click', () => {
    trackCommerce('commerce.checkouts', cart);
    const { purchaseID, total: paid } = purchase(cart);
    writeCart([]);
    block.innerHTML = '<p class="cart-confirm"></p>';
    block.querySelector('p').textContent = `Order ${purchaseID} placed for ${money(paid)}. This is a demo; nothing was charged.`;
  });
}

export default function decorate(block) {
  view(block);
  window.addEventListener('poc:cart', () => {
    if (block.isConnected && !block.querySelector('.cart-confirm')) view(block);
  });
}
