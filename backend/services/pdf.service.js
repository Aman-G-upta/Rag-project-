const pdfParse = require("pdf-parse");

async function extractPdfPages(buffer) {
  const pages = [];
  let pageNum = 0;

  const options = {
    pagerender: function (pageData) {
      pageNum += 1;
      return pageData.getTextContent().then((textContent) => {
        let text = "";
        for (const item of textContent.items) {
          text += item.str + " ";
        }
        pages.push({ pageNumber: pageNum, text: text.trim() });
        return text;
      });
    },
  };

  const data = await pdfParse(buffer, options);
  return { pages, numPages: data.numpages };
}

module.exports = { extractPdfPages };