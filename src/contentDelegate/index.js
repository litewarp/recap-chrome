const ContentDelegate = (
  tabId,
  url,
  path,
  court,
  pacer_case_id,
  pacer_doc_id,
  links
) => {
  this.tabId = tabId;
  this.url = url;
  this.path = path;
  this.court = court;
  this.pacer_case_id = pacer_case_id;
  if (pacer_doc_id) {
    this.pacer_doc_id = pacer_doc_id;
    this.pacer_doc_ids = [pacer_doc_id];
  } else {
    this.pacer_doc_ids = [];
  }
  this.links = links || [];

  this.notifier = importInstance(Notifier);
  this.recap = importInstance(Recap);

  this.findAndStorePacerDocIds();

  this.restricted = this.checkRestrictions();
};