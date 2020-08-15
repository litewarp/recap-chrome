import $ from 'jquery';
import PACER from '../pacer';
import { debug, httpRequest, iFrameForPdf } from '../utils';

export async function onDocumentViewSubmit(event) {
  if (!event.data.id) return;

  // Save a copy of the page source, altered so that the "View Document"
  // button goes forward in the history instead of resubmitting the form.
  let originalForm = document.forms[0];
  let originalSubmit = originalForm.getAttribute('onsubmit');
  originalForm.setAttribute('onsubmit', 'history.forward(); return false;');
  let previousPageHtml = document.documentElement.innerHTML;
  originalForm.setAttribute('onsubmit', originalSubmit);

  let form = document.getElementById(event.data.id);
  // Grab the document number, attachment number, and docket number
  let document_number, attachment_number, docket_number;

  if (!PACER.isAppellateCourt(this.court)) {
    // This CSS selector duplicated in isSingleDocumentPage
    let image_string = $('td:contains(Image)').text();
    let regex = /(\d+)-(\d+)/;
    let matches = regex.exec(image_string);
    if (!matches) {
      form.submit();
      return;
    }
    document_number = matches[1];
    attachment_number = matches[2];
    docket_number = $.trim($('tr:contains(Case Number) td:nth(1)').text());
  } else {
    // Appellate
    debug(4, 'Appellate parsing not yet implemented');
  }

  // Now do the form request to get to the view page.  Some PACER sites will
  // return an HTML page containing an <iframe> that loads the PDF document;
  // others just return the PDF document.  As we don't know whether we'll get
  // HTML (text) or PDF (binary), we ask for an ArrayBuffer and convert later.
  document.querySelector('body').classList += 'cursor wait';

  const msg = {
    submit: (status) =>
      `RECAP: Successfully submitted RECAP "View" button form: ${
        status ? 'Success' : 'Error'
      }`,
  };

  const contentFetch =
    navigator.userAgent.indexOf('Chrome') < 0 ? content.fetch : window.fetch;

  const blob = await contentFetch(form.action, {
    method: 'POST',
    body: new FormData(form),
  }).then((res) => {
    console.info(msg.submit(res.ok));
    return res.blob();
  });

  // If we got a PDF, we wrap it in a simple HTML page.
  // This lets us treat both cases uniformly: either
  // way we have an HTML page with an <iframe> in it,
  // which is handled by showPdfPage.
  if (blob.type === 'application/pdf') {
    // canb and ca9 return PDFs and trigger this code path.
    const newHtml = document.documentElement;
    newHtml.querySelector('body').innerHTML = iFrameForPdf({
      src: URL.createObjectURL(blob),
    });
    const html = newHtml.innerHTML;
    this.showPdfPage(
      document.documentElement,
      html,
      previousPageHtml,
      document_number,
      attachment_number,
      docket_number
    );
  } else {
    // dcd (and presumably others) trigger this code path.
    const reader = new FileReader();
    reader.onload = () => {
      let html = reader.result;
      // check if we have an HTML page which redirects the user to the PDF
      // this was first display by the Northern District of Georgia
      // https://github.com/freelawproject/recap/issues/277
      const redirectResult = Array.from(
        html.matchAll(/window\.location\s*=\s*["']([^"']+)["'];?/g)
      );

      if (redirectResult.length > 0) {
        const newHtml = document.documentElement;
        newHtml.querySelector('body').innerHTML = iFrameForPdf({
          src: redirectResult[0][1],
        });
        html = newHtml.innerHTML;
      }

      this.showPdfPage(
        document.documentElement,
        html,
        previousPageHtml,
        document_number,
        attachment_number,
        docket_number
      );
    };
    reader.readAsText(blob); // convert blob to HTML text
  }
}
