'use strict';
/*
!! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !!
!!
!!  This script applies only after MarkDown parsing!
!!  If the RSS feed contains lines that do not start with a (potentially
!!  indented) XML tag, the MarkDown parser will likely consider it as
!!  end of the RSS feed prematurely.
!!
!!  Also keep in mind that when injecting RSS into HTML, there is
!!  absolutely no CDATA handling at all!
!!
!! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !! !!
*/
/* global window */
(function install() {
  const { MDwiki } = window;
  const { qs1, qsMap, mkTag, mapChTags } = MDwiki;

  MDwiki.fx.base.addCss([
    'ul.rss-feed-items { padding-left: 0; }',
    'li.rss-feed-item { margin-left: 0; list-style-type: none; }',
    'li.rss-feed-item > date { font-size: 70%; margin-right: 1ex; }',
  ]);

  const EX = {

    scan(container) {
      qsMap(container, '.markdown.markdown-from-file rss channel', EX.upgrade);
    },

    upgrade(chanElem) {
      EX.hoist(chanElem);
      const wrapper = mkTag('div', { className: 'rss-feed-channel' });
      const chanPar = chanElem.parentNode;
      chanPar.insertBefore(wrapper, chanElem);
      chanPar.removeChild(chanElem);
      const hlTag = mkTag('h3', { className: 'rss-feed-title' });
      wrapper.appendChild(hlTag);
      const list = mkTag('ul', { className: 'rss-feed-items' });
      wrapper.appendChild(list);
      let titles = '';
      mapChTags(chanElem, {
        title(t) { titles += t.innerHTML.trim() + '\n'; },
        item: EX.convertOneNewsItem,
      }, list);
      titles = titles.trim();
      if (!titles) { hlTag.className += ' empty'; }
      hlTag.innerText = titles;
    },

    hoist(chanElem) {
      const tooFar = chanElem.closest('.markdown');
      let cur = chanElem;
      let par;
      while (cur !== tooFar) {
        par = cur.parentNode;
        if (!par) { return; }
        if (cur !== par.firstElementChild) { return; }
        par.insertBefore(chanElem, cur);
        if (!cur.childElementCount) { par.removeChild(cur); }
        cur = par;
      }
    },

    convertOneNewsItem(feedItem, feedItemIdx, lcItemTagName, list) {
      const bullet = mkTag('li', { className: 'rss-feed-item' });
      list.appendChild(bullet);
      const ds = {};
      ds.pubDate = qs1(feedItem, 'pubdate').innerText;
      if (ds.pubDate) {
        const pubTs = new Date(ds.pubDate);
        ds.pubUts = Math.floor(pubTs.getTime() / 1e3);
        ds.dateTimeShort = EX.fmtDateTimeShort(ds.pubDate);
      }
      bullet.appendChild(mkTag('date', { innerText: ds.dateTimeShort }));
      ds.title = qs1(feedItem, 'title').innerHTML;
      ds.link = qs1(feedItem, 'link + a').innerText;
      Object.assign(bullet.dataset, ds);
      const lnk = mkTag('a', { innerText: ds.title, href: ds.link });
      bullet.appendChild(lnk);
    },

    fmtDateTimeShort(orig) {
      let v = new Date(orig);
      v.setMinutes(v.getMinutes() - v.getTimezoneOffset());
      v = v.toISOString();
      v = v.slice(0, 10) + ' ' + v.slice(11, 16);
      console.debug(v);
      return v;
    },

  };

  window.pre2gfm.onRendered.push(EX.scan);
}());
