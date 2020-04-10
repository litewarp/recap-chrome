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

  const genDocTitle = (titleString) => {
    const title = document.createElement('title');
    title.text = titleString;
    return title;
  }

  const setTitle = (docTitleString) => {
    let existingTitle = document.querySelector('head > title');
    if (!existingTitle) {
      const title = document.createElement('title');
      document.querySelector('head').appendChild(title);
      existingTitle = title;
    }
    existingTitle.innerText = docTitleString;
  };
  beforeEach(async () => {
    const dataUrl = await blobToDataURL(new Blob([new ArrayBuffer(1000), { type: 'application/zip' }]));
    window.chrome = {
      storage: {
        local: {
          get: jasmine.createSpy('get').and.callFake((key, cb) => {
            cb({
              options: {
                recap_enabled: true,
                ['ia_style_filenames']: true,
                ['lawyer_style_filenames']: false,
                ['external_pdf']: true
              },
              [tabId]: {
                ['zip_blob']: dataUrl,
                docsToCases: { ['034031424909']: '531591' }
              }
            });
          }),
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
      const ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
      expect(ad.tabId).toBe(tabId);
      expect(ad.court).toBe(court);
      expect(ad.links).toEqual([]);
      expect(ad.pacerDocId).toBe(undefined);
    });

    describe('it is not on any identified appellate page', () => {

      beforeEach(() => {
        setTitle('');
        ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
      });

      it('has no targetPage set', () => {
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
    let ad;

    beforeEach(() => {
      const anchor = document.createElement('a');
      anchor.setAttribute('title', 'Open Document');
      anchor.setAttribute('onclick', 'return doDocPostURL(\'00107526453\', \'45846\' )');
      document.querySelector('body').appendChild(anchor);
      ad = new AppellateDelegate({ tabId: tabId, court: court, links: [], pacerDocId: undefined });
      spyOn(ad, 'checkForAndUploadOpinion').and.callThrough();
      spyOn(ad.recap, 'uploadAppellatePage').and.callFake((params, callback) => {
        callback.tab = { id: 1234 };
        callback(true);
      });
      spyOn(history, 'replaceState').and.callThrough();
      spyOn(ad.notifier, 'showUpload').and.callFake((message, callback) => {
        callback(true);
      });
    });

    afterEach(() => {
      document.querySelector('a[title="Open Document"]').remove();
    });

    it('calls checkForAndUploadOpinion', async () => {
      await ad.handleDocketPage();
      expect(ad.checkForAndUploadOpinion).toHaveBeenCalledWith({ pacerCaseId: '45846' });
    });

    describe('the page has already been uploaded', () => {

      beforeEach(() => {
        history.replaceState({ uploaded: true }, '');
      });

      afterEach(() => {
        history.replaceState({}, '');
      });
      it('does nothing', async () => {
        await ad.handleDocketPage();
        expect(ad.recap.uploadAppellatePage).not.toHaveBeenCalled();
      });

    });

    describe('recap is not enabled', () => {
      let existingGet;
      beforeEach(() => {
        existingGet = window.chrome.storage.local.get;
        window.chrome.storage.local.get = jasmine.createSpy().and.returnValue({ options: { recap_enabled: false } });
      });

      afterEach(() => {
        window.chrome.storage.local.get = existingGet;
      });

      it('should do nothing', async () => {
        expect(ad.recap.uploadAppellatePage).not.toHaveBeenCalled();
      });
    });

    it('calls uploadAppellatePage', async () => {
      await ad.handleDocketPage();
      expect(ad.recap.uploadAppellatePage).toHaveBeenCalled();
    });

    it('should dispatch the notifier', async () => {
      await ad.handleDocketPage();
      expect(ad.notifier.showUpload).toHaveBeenCalled();
    });

  });

});
