const fs = require('fs');

async function test() {
  const formData = new FormData();
  formData.append('file', new Blob([Buffer.from('test image')]), 'test.jpg');
  formData.append('filename', 'test.jpg');
  formData.append('folder', 'news');

  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    console.log(res.status, await res.text());
  } catch (e) {
    console.error(e);
  }
}
test();
