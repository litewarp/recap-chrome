/*global jasmine, DEBUGLEVEL */
describe('The AppellateDelegate class', function () {
  // 'tabId' values
  const tabId = 1234;
  const court = 'ca9';
  const caseSearchTitle = 'Case Search';
  const caseQueryTitle = 'Case Query';
  const advancedCaseSearchTitle = 'Case Search - Advanced';
  const caseSearchResultsTitle = 'Cases Selection Table';
  const downloadConfirmationTitle = 'Download Confirmation';
  const attachmentMenuTitle = 'Document';
  const fullDocketSearchTitle = 'Docket Report Filter';
  const shortDocketTitle = '19-15716 Summary';
  const longDocketTitle = '19-15716 Docket';

  const newAppDel = () => new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
  const blob = new Blob([new ArrayBuffer(100)], { type: 'application/pdf' });

  const genDocTitle = (titleString) => {
    const title = document.createElement('title');
    title.text = titleString;
    return title;
  };

  const setTitle = (docTitleString) => {
    let existingTitle = document.querySelector('head > title');
    if (!existingTitle) {
      const title = document.createElement('title');
      document.querySelector('head').appendChild(title);
      existingTitle = title;
    }
    existingTitle.innerText = docTitleString;
  };

  const returnFakeStore = async ({ optionsOverride }) => {
    const dataUrl = await blobToDataURL(blob);
    const options = optionsOverride
      ? optionsOverride
      : ({
        recap_enabled: true,
        ia_style_filenames: true,
        lawyer_style_filenames: false,
        external_pdf: true,
      });
    return {
      options: options,
      [tabId]: {
        zip_blob: dataUrl,
        docsToCases: { ['034031424909']: '531591' }
      }
    };
  };

  beforeEach(() => {
    window.chrome = {
      storage: {
        local: {
          get: jasmine.createSpy('get').and.callFake(async (key, cb) => cb(await returnFakeStore())),
          remove: jasmine.createSpy('remove').and.callFake(() => { }),
          set: jasmine.createSpy('set').and.callFake(function () { })
        }
      }
    };
    spyOn(window, 'fetch').and.callFake((url, options) => {
      const res = {};
      res.status = jasmine.createSpy().and.callFake(() => Promise.resolve('200'));
      res.text = jasmine.createSpy().and.callFake(() => Promise.resolve(`<html><iframe src="http://dummylink.com"></iframe></html>`));
      res.json = jasmine.createSpy().and.callFake(() => Promise.resolve({ result: true }));
      res.blob = jasmine.createSpy().and.callFake(() => Promise.resolve(blob));
      return Promise.resolve(res);
    });;
    window.saveAs = jasmine.createSpy('saveAs').and.callFake(
      (blob, filename) => Promise.resolve(true)
    );
    spyOn(window, 'addEventListener').and.callThrough();
  });

  afterEach(() => {
    delete window.chrome;
  });

  describe('AppellateDelegate constructor', () => {

    it('gets created with the necessary arguments', () => {
      const ad = newAppDel();
      expect(ad.tabId).toBe(tabId);
      expect(ad.court).toBe(court);
      expect(ad.links).toEqual([]);
      expect(ad.pacerDocId).toBe(undefined);
    });

    describe('it is not on any identified appellate page', () => {
      beforeEach(() => setTitle(''));

      it('has no targetPage set', () => {
        const ad = newAppDel();
        expect(ad.targetPage).not.toBeTruthy();
      });
    });

    describe('it is on a caseSearchPage', () => {
      let ad;
      beforeEach(() => {
        setTitle(caseSearchTitle);
        ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
        spyOn(ad, 'handleCaseSearchPage').and.callFake(() => { });
      });

      it('sets the targetPage to "caseSearch"', () => {
        expect(ad.targetPage).toBe('caseSearch');
      });

      it('calls handleCaseSearchPage', () => {
        ad.dispatchTargetHandler();
        expect(ad.handleCaseSearchPage).toHaveBeenCalled();
      });
    });

    describe('it is on an advancedCaseSearchPage', () => {
      let ad;
      beforeEach(() => {
        setTitle(advancedCaseSearchTitle);
        ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
        spyOn(ad, 'handleCaseSearchPage').and.callFake(() => { });
      });

      it('sets the targetPage to "advancedCaseSearch"', () => {
        expect(ad.targetPage).toBe('advancedCaseSearch');
      });

      it('calls handleCaseSearchPage', () => {
        ad.dispatchTargetHandler();
        expect(ad.handleCaseSearchPage).toHaveBeenCalled();
      });
    });

    describe('it is on a caseSearchResultsPage', () => {
      let ad;
      beforeEach(() => {
        setTitle(caseSearchResultsTitle);
        ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
        spyOn(ad, 'handleCaseSearchResultsPage').and.callFake(() => { });
      });

      it('sets the targetPage to "caseSearchResults"', () => {
        expect(ad.targetPage).toBe('caseSearchResults');
      });

      it('calls handleCaseSearchResultsPage', () => {
        ad.dispatchTargetHandler();
        expect(ad.handleCaseSearchResultsPage).toHaveBeenCalled();
      });
    });

    describe('it is on a caseQueryPage', () => {
      let ad;
      beforeEach(() => {
        setTitle(caseQueryTitle);
        ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
        spyOn(ad, 'handleCaseQueryPage').and.callFake(() => { });
      });

      it('sets the targetPage to "caseQuery"', () => {
        expect(ad.targetPage).toBe('caseQuery');
      });

      it('calls handleCaseQueryPage', () => {
        ad.dispatchTargetHandler();
        expect(ad.handleCaseQueryPage).toHaveBeenCalled();
      });
    });

    describe('it is on a downloadConfirmationPage', () => {
      let ad;
      beforeEach(() => {
        setTitle(downloadConfirmationTitle);
        ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
        spyOn(ad, 'handleDownloadConfirmationPage').and.callFake(() => { });
      });

      it('sets the targetPage to "downloadConfirmation"', () => {
        expect(ad.targetPage).toBe('downloadConfirmation');
      });

      it('calls handleDownloadConfirmationPage', () => {
        ad.dispatchTargetHandler();
        expect(ad.handleDownloadConfirmationPage).toHaveBeenCalled();
      });

      describe('it is on an attachmentMenuPage', () => {
        let ad;
        beforeEach(() => {
          setTitle(attachmentMenuTitle);
          ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
          spyOn(ad, 'handleAttachmentMenuPage').and.callFake(() => { });
        });

        it('sets the targetPage to "attachmentMenu"', () => {
          expect(ad.targetPage).toBe('attachmentMenu');
        });

        it('calls handleAttachmentMenuPage', () => {
          ad.dispatchTargetHandler();
          expect(ad.handleAttachmentMenuPage).toHaveBeenCalled();
        });
      });
      describe('it is on a fullDocketSearchPage', () => {
        let ad;
        beforeEach(() => {
          setTitle(fullDocketSearchTitle);
          ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
          spyOn(ad, 'handleFullDocketSearchPage').and.callFake(() => { });
        });

        it('sets the targetPage to "fullDocketSearch"', () => {
          expect(ad.targetPage).toBe('fullDocketSearch');
        });

        it('calls handleAttachmentMenuPage', () => {
          ad.dispatchTargetHandler();
          expect(ad.handleFullDocketSearchPage).toHaveBeenCalled();
        });
      });

      describe('it is on a shortDocketPage', () => {
        let ad;
        beforeEach(() => {
          setTitle(shortDocketTitle);
          ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
          spyOn(ad, 'handleDocketPage').and.callFake(() => { });
        });

        it('sets the targetPage to "shortDocket"', () => {
          expect(ad.targetPage).toBe('shortDocket');
        });

        it('calls handleAttachmentMenuPage', () => {
          ad.dispatchTargetHandler();
          expect(ad.handleDocketPage).toHaveBeenCalled();
        });
      });
      describe('it is on a fullDocketPage', () => {
        let ad;
        beforeEach(() => {
          setTitle(longDocketTitle);
          ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
          spyOn(ad, 'handleDocketPage').and.callFake(() => { });
        });

        it('sets the targetPage to "fullDocket"', () => {
          expect(ad.targetPage).toBe('fullDocket');
        });

        it('calls handleAttachmentMenuPage', () => {
          ad.dispatchTargetHandler();
          expect(ad.handleDocketPage).toHaveBeenCalled();
        });
      });

    });
  });

  describe('when handleDocketPage has been called', () => {
    beforeEach(() => {
      const table = document.createElement('table');
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.textContent = 'OPINION';
      td.setAttribute('width', '90%');
      tr.appendChild(td);
      table.appendChild(tr);
      document.querySelector('body').appendChild(table);
      const anchor = document.createElement('a');
      anchor.setAttribute('title', 'Open Document');
      anchor.setAttribute(
        'onclick',
        'return doDocPostURL(\'00107526453\', \'45846\' )'
      );
      document.querySelector('body').appendChild(anchor);
    });

    afterEach(() => {
      document.querySelector('table').remove();
    });

    it('calls checkForAndUploadOpinion', async () => {
      const ad = newAppDel();
      spyOn(ad, 'checkForAndUploadOpinion').and.callFake(() => { });
      await ad.handleDocketPage();
      expect(ad.checkForAndUploadOpinion).toHaveBeenCalledWith({
        pacerCaseId: '45846'
      });
    });

    it('calls uploadAppellatePage', async () => {
      const ad = newAppDel();
      spyOn(ad.recap, 'uploadAppellatePage').and.callFake((params, cb) => cb(true));
      await ad.handleDocketPage();
      expect(ad.recap.uploadAppellatePage).toHaveBeenCalled();
    });

    it('should dispatch the notifier', async () => {
      const ad = newAppDel();
      spyOn(ad.notifier, 'showUpload').and.callFake((msg, cb) => cb(true));
      await ad.handleDocketPage();
      expect(ad.notifier.showUpload).toHaveBeenCalled();
    });

    describe('recap is not enabled', () => {
      beforeEach(() => {
        window.chrome.storage.local.get = jasmine.createSpy().and.returnValue({ options: { recap_enabled: false } });
      });
      it('should do nothing', async () => {
        const ad = newAppDel();
        spyOn(ad.recap, 'uploadAppellatePage').and.callFake((params, cb) => cb(true));
        expect(ad.recap.uploadAppellatePage).not.toHaveBeenCalled();
      });
    });

    describe('the page has already been uploaded', () => {
      beforeEach(() => {
        window.history.pushState({ uploaded: true }, '');
      });

      it('does nothing', async () => {
        const ad = newAppDel();
        spyOn(ad.recap, 'uploadAppellatePage').and.callFake(() => { });
        await ad.handleDocketPage();
        expect(ad.recap.uploadAppellatePage).not.toHaveBeenCalled();
      });
    });
  });

  describe('when checkForAndUploadOpinion is called', () => {

    describe('when an opinion is not available', () => {
      it('should do nothing', async () => {
        const ad = newAppDel();
        await ad.checkForAndUploadOpinion({ pacerCaseId: '531931' });
        expect(window.fetch).not.toHaveBeenCalled();
      });
    });

    describe('when an opinion is available', () => {
      let origDocUrl;
      beforeEach(() => {
        const tr = document.createElement('tr');

        const td = document.createElement('td');
        td.textContent = 'OPINION';
        td.setAttribute('width', '90%');
        tr.appendChild(td);

        const anchor = document.createElement('a');
        anchor.href = '/docs1/12345678/docs1/23456789';
        tr.append(anchor);

        const table = document.createElement('table');
        table.appendChild(tr);
        document.querySelector('body').appendChild(table);

        origDocUrl = document.URL;
        document.URL = [
          'https://ecf.ca9.uscourts.gov',
          'in/bean/servlet/TransportRoom',
          'servlet?="moo"'
        ].join('/');
        setTitle(longDocketTitle);
      });

      afterEach(() => {
        document.querySelector('table').remove();
        document.URL = origDocUrl;
        setTitle('');
      });

      it('should try to download the opinion', async () => {
        ad = newAppDel();
        await ad.checkForAndUploadOpinion({ pacerCaseId: '531931' });
        expect(window.fetch).toHaveBeenCalled();
      });

      describe('it downloads a blob of type pdf', () => {

        it('should store the blob and upload it if the blob if of type pdf', async () => {
          const ad = newAppDel();
          spyOn(ad.recap, 'uploadAppellateDocument').and.callFake((fetchParams, cb) => cb(true));
          spyOn(ad.notifier, 'showUpload').and.callFake((msg, cb) => cb(msg));
          await ad.checkForAndUploadOpinion({ pacerCaseId: '531931' });
          expect(ad.recap.uploadAppellateDocument).toHaveBeenCalled();
        });

        it('calls the notifier', async () => {
          const ad = newAppDel();
          spyOn(ad.recap, 'uploadAppellateDocument').and.callFake((fetchParams, cb) => cb(true));
          spyOn(ad.notifier, 'showUpload').and.callFake((msg, cb) => cb(msg));
          await ad.checkForAndUploadOpinion({ pacerCaseId: '531931' });
          expect(ad.notifier.showUpload).toHaveBeenCalled();
        });
      });
    });

  });
});