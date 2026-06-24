// FocusShield Background Service Worker

const defaultSettings = {
  masterToggle: true,
  youtube: {
    enabled: true,
    blockFullSite: false,
    sidebar: true,
    comments: true,
    feed: true,
    shorts: true,
    autoplay: true
  },
  facebook: {
    enabled: true,
    blockFullSite: false,
    feed: true,
    stories: true,
    notifications: true,
    reels: true,
    messenger: true,
    comments: true,
    friends: true,
    groups: true,
    pages: true
  },
  instagram: {
    enabled: true,
    blockFullSite: false,
    feed: true,
    reels: true,
    explore: true,
    stories: true,
    sponsored: true,
    shopping: true,
    messages: true,
    notifications: true,
    comments: true
  },
  reddit: {
    enabled: true,
    blockFullSite: false,
    promoted: true,
    communities: true,
    search: true,
    premium: true,
    trending: true,
    popularAll: true,
    commentsSection: true,
    chatDMs: true
  },
  tiktok: {
    enabled: true,
    blockFullSite: false,
    foryou: true,
    following: true,
    suggested: true,
    live: true,
    shop: true,
    badges: true,
    comments: true,
    search: true,
    upload: true
  },
  twitter: {
    enabled: true,
    blockFullSite: false,
    trending: true,
    whotofollow: true,
    promoted: true,
    spaces: true,
    messages: true,
    explore: true,
    communities: true,
    notifications: true,
    premium: true,
    feed: true
  },
  customSites: []
};

function mergeWithDefaults(stored) {
  const merged = { ...defaultSettings };
  if (stored) {
    if (stored.masterToggle !== undefined) merged.masterToggle = stored.masterToggle;
    const platforms = ['youtube', 'facebook', 'instagram', 'reddit', 'tiktok', 'twitter'];
    platforms.forEach(p => {
      if (stored[p] && typeof stored[p] === 'object') {
        merged[p] = { ...defaultSettings[p], ...stored[p] };
        if (p === 'reddit' && merged[p].awards !== undefined) {
          delete merged[p].awards;
        }
      }
    });
    if (Array.isArray(stored.customSites)) merged.customSites = stored.customSites;
    if (stored.previousPlatformStates) merged.previousPlatformStates = stored.previousPlatformStates;
    if (stored.previousCustomSiteStates) merged.previousCustomSiteStates = stored.previousCustomSiteStates;
  }
  return merged;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(null, (result) => {
    const updated = mergeWithDefaults(result);
    chrome.storage.local.set(updated, () => {
      console.log('FocusShield settings initialized/migrated.');
    });
  });
});

// TAB LISTENER: When tab updates, apply rules and send settings to content.js
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(null, (result) => {
      if (result && result.masterToggle !== undefined) {
        chrome.tabs.sendMessage(tabId, {
          type: 'SETTINGS_UPDATED',
          settings: result
        }).catch(() => {
          // Ignore error for non-matching URLs where content script is not injected
        });
      }
    });
  }
});
