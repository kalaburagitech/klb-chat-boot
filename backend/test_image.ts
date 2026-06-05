import axios from "axios";
import fs from "fs";

async function test() {
  try {
    const url = "https://github.com/user-attachments/assets/f824d625-bf14-4801-acd3-024d2265808a";
    const res = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data);
    console.log("Downloaded bytes:", buffer.length);
    fs.writeFileSync("test.jpg", buffer);
    console.log("Saved to test.jpg");
  } catch (e) {
    console.error(e);
  }
}
test();
