const wait = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));
async function main() {
  console.log('Order placed');
  const [a, b] = await Promise.all([wait(200, 'Pizza ready'), wait(100, 'Driver assigned')]);
  console.log(a); console.log(b); console.log('Delivered');
}
main();
