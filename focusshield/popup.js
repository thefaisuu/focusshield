// FocusShield Popup Logic
document.addEventListener('DOMContentLoaded', () => {
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

  let settings = { ...defaultSettings };
  let currentSiteHostname = '';
  let currentDetailPlatform = '';
  let isCustomSitesExpanded = false;

  const platformOptionsDef = {
    youtube: [
      { key: 'sidebar', label: 'Sidebar recommendations' },
      { key: 'comments', label: 'Comments section' },
      { key: 'feed', label: 'Homepage video feed' },
      { key: 'shorts', label: 'Shorts shelf' },
      { key: 'autoplay', label: 'Autoplay next video' }
    ],
    facebook: [
      { key: 'feed', label: 'News feed' },
      { key: 'stories', label: 'Stories bar' },
      { key: 'notifications', label: 'Notification badges' },
      { key: 'reels', label: 'Reels section' },
      { key: 'messenger', label: 'Messenger chat' },
      { key: 'comments', label: 'Comments section' },
      { key: 'friends', label: 'Block Friends' },
      { key: 'groups', label: 'Block Groups' },
      { key: 'pages', label: 'Block Pages' }
    ],
    instagram: [
      { key: 'feed', label: 'Home Feed' },
      { key: 'reels', label: 'Reels tab' },
      { key: 'explore', label: 'Explore page' },
      { key: 'stories', label: 'Stories bar' },
      { key: 'sponsored', label: 'Sponsored posts' },
      { key: 'shopping', label: 'Shopping tab' },
      { key: 'messages', label: 'Block Direct Messages' },
      { key: 'notifications', label: 'Block Notifications' },
      { key: 'comments', label: 'Block Comments Section' }
    ],
    reddit: [
      { key: 'promoted', label: 'Promoted posts' },
      { key: 'communities', label: 'Communities list' },
      { key: 'search', label: 'Search Box' },
      { key: 'premium', label: 'Premium banners' },
      { key: 'trending', label: 'Trending communities' },
      { key: 'popularAll', label: 'Popular & All feeds' },
      { key: 'commentsSection', label: 'Block Comment Sections' },
      { key: 'chatDMs', label: 'Block Chat / DMs' }
    ],
    tiktok: [
      { key: 'foryou', label: 'For you feed' },
      { key: 'following', label: 'Following feed' },
      { key: 'suggested', label: 'Suggested accounts' },
      { key: 'live', label: 'Live section' },
      { key: 'shop', label: 'Shop tab' },
      { key: 'badges', label: 'Notification badges' },
      { key: 'comments', label: 'Comments section' },
      { key: 'search', label: 'Search bar / Results' },
      { key: 'upload', label: 'Upload / Create button' }
    ],
    twitter: [
      { key: 'feed', label: 'Home Feed' },
      { key: 'trending', label: 'Trending topics' },
      { key: 'whotofollow', label: 'Who to follow' },
      { key: 'promoted', label: 'Promoted tweets' },
      { key: 'spaces', label: 'Spaces bar' },
      { key: 'messages', label: 'Block Messages' },
      { key: 'explore', label: 'Explore Tab / Search Feed' },
      { key: 'communities', label: 'Communities' },
      { key: 'notifications', label: 'Notifications' },
      { key: 'premium', label: 'Hide Premium Banners' }
    ]
  };

  // Element mappings to HTML elements
  const elements = {
    masterToggle: document.getElementById('master-toggle'),
    masterStatus: document.getElementById('master-status'),
    customSitesList: document.getElementById('custom-sites-list')
  };

  // Helper: Get domain matching a platform key
  function getDomainFromPlatform(platform) {
    switch (platform) {
      case 'youtube': return 'youtube.com';
      case 'facebook': return 'facebook.com';
      case 'twitter': return 'twitter.com';
      case 'reddit': return 'reddit.com';
      case 'instagram': return 'instagram.com';
      case 'tiktok': return 'tiktok.com';
      default: return '';
    }
  }

  // Helper: Finalize focus session for one or more domains.
  // Saves current accumulated time as "lastSecs", resets session.
  function finalizeSession(domains) {
    if (!domains || domains.length === 0) return;
    const STATS_KEY = 'focusStats';
    chrome.storage.local.get(STATS_KEY, (result) => {
      const allStats = result[STATS_KEY] || {};
      const now = Date.now();
      let changed = false;
      domains.forEach(domain => {
        if (!domain) return;
        const entry = allStats[domain];
        if (!entry || !entry.sessionStart) return;
        const elapsed = Math.floor((now - entry.sessionStart) / 1000);
        const total = (entry.priorSecs || 0) + elapsed;
        allStats[domain] = {
          sessionStart: null,
          priorSecs: 0,
          lastSecs: total
        };
        changed = true;
      });
      if (changed) chrome.storage.local.set({ [STATS_KEY]: allStats });
    });
  }

  // Helper: Reload tab if it is on the target custom site
  function reloadTabIfOnDomain(domain) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        try {
          const urlObj = new URL(tabs[0].url);
          const hostname = urlObj.hostname.toLowerCase();
          const targetDomain = domain.toLowerCase();
          
          let matches = false;
          if (hostname === targetDomain || hostname.endsWith('.' + targetDomain)) {
            matches = true;
          } else if (targetDomain === 'twitter.com' && (hostname === 'x.com' || hostname.endsWith('.x.com'))) {
            matches = true;
          } else if (urlObj.protocol.startsWith('chrome-extension') && urlObj.pathname.includes('blocked.html')) {
            const params = new URLSearchParams(urlObj.search);
            const siteParam = params.get('site') || '';
            if (siteParam.toLowerCase() === targetDomain || siteParam.toLowerCase().endsWith('.' + targetDomain)) {
              matches = true;
            } else if (targetDomain === 'twitter.com' && (siteParam.toLowerCase() === 'x.com' || siteParam.toLowerCase().endsWith('.x.com'))) {
              matches = true;
            }
          }
          
          if (matches) {
            if (urlObj.protocol.startsWith('chrome-extension') && urlObj.pathname.includes('blocked.html')) {
              // Redirect blocked page back to original URL
              const params = new URLSearchParams(urlObj.search);
              const originalUrl = params.get('originalUrl') || ('https://' + targetDomain);
              chrome.tabs.update(tabs[0].id, { url: originalUrl });
            } else {
              chrome.tabs.reload(tabs[0].id);
            }
          }
        } catch (e) {
          console.error('Error reloading tab for domain:', e);
        }
      }
    });
  }

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

  // 1. STARTUP: Load settings from storage
  chrome.storage.local.get(null, (result) => {
    settings = mergeWithDefaults(result);
    chrome.storage.local.set(settings);
    applySettingsToUI();
    detectCurrentSite();

    if (!result || !result.hasSeenFirstTimeHint) {
      const youtubeSettings = document.getElementById('settings-youtube');
      if (youtubeSettings) {
        youtubeSettings.classList.add('pulse-hint');
      }
    }
  });

  // Apply settings properties to UI controls
  function applySettingsToUI() {
    // Master toggle
    elements.masterToggle.checked = settings.masterToggle !== false;
    updateMasterStatusText(settings.masterToggle !== false);
    
    // Platforms master switches
    const platformsList = ['youtube', 'facebook', 'twitter', 'reddit', 'instagram', 'tiktok'];
    platformsList.forEach(p => {
      const toggleInput = document.getElementById(`toggle-${p}`);
      if (toggleInput) {
        toggleInput.checked = settings[p] && settings[p].enabled !== false;
        toggleInput.disabled = !settings.masterToggle;
      }
      const settingsBtn = document.getElementById(`settings-${p}`);
      if (settingsBtn) {
        settingsBtn.disabled = !settings.masterToggle;
        if (!settings.masterToggle) {
          settingsBtn.classList.add('disabled-btn');
        } else {
          settingsBtn.classList.remove('disabled-btn');
        }
      }
    });
    
    if (!settings.masterToggle) {
      elements.customSitesList.classList.add('disabled-container');
      const footer = document.getElementById('custom-sites-footer');
      if (footer) footer.classList.add('disabled-container');
    } else {
      elements.customSitesList.classList.remove('disabled-container');
      const footer = document.getElementById('custom-sites-footer');
      if (footer) footer.classList.remove('disabled-container');
    }

    // Custom sites list
    renderCustomSites();
  }

  // Update master toggle status label style/text
  function updateMasterStatusText(enabled) {
    if (enabled) {
      elements.masterStatus.textContent = 'Active';
      elements.masterStatus.className = 'status-active';
    } else {
      elements.masterStatus.textContent = 'Paused';
      elements.masterStatus.className = 'status-paused';
    }
  }

  // Save settings state and broadcast to active tabs
  function saveSettings() {
    chrome.storage.local.set(settings, () => {
      // Broadcast settings update to content.js on the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          if (settings.masterToggle) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'SETTINGS_UPDATED',
              settings: settings
            }).catch(() => {});
          } else {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'MASTER_OFF'
            }).catch(() => {});
          }
        }
      });
    });
  }

  // 2. MASTER TOGGLE LISTENERS
  elements.masterToggle.addEventListener('change', () => {
    settings.masterToggle = elements.masterToggle.checked;
    updateMasterStatusText(settings.masterToggle);
    
    const platformsList = ['youtube', 'facebook', 'twitter', 'reddit', 'instagram', 'tiktok'];
    
    if (!settings.masterToggle) {
      // Save current states of platforms
      const states = {};
      platformsList.forEach(p => {
        states[p] = settings[p] ? (settings[p].enabled !== false) : true;
        if (settings[p]) {
          settings[p].enabled = false;
        }
      });
      settings.previousPlatformStates = states;

      // Save and turn off custom sites
      const customStates = {};
      if (Array.isArray(settings.customSites)) {
        settings.customSites.forEach(site => {
          customStates[site.id] = site.enabled !== false;
          site.enabled = false;
        });
      }
      settings.previousCustomSiteStates = customStates;
    } else {
      // Restore saved states if they exist
      const states = settings.previousPlatformStates || {};
      platformsList.forEach(p => {
        if (settings[p]) {
          settings[p].enabled = states[p] !== false;
        }
      });

      // Restore custom sites
      const customStates = settings.previousCustomSiteStates || {};
      if (Array.isArray(settings.customSites)) {
        settings.customSites.forEach(site => {
          site.enabled = customStates[site.id] !== false;
        });
      }
    }
    
    saveSettings();
    applySettingsToUI();
  });

  // 3. PLATFORM MASTER SWITCH LISTENERS
  const platformMasterSwitches = document.querySelectorAll('.platform-master-toggle');
  platformMasterSwitches.forEach(toggle => {
    toggle.addEventListener('change', () => {
      const platform = toggle.dataset.platform;
      if (settings[platform]) {
        settings[platform].enabled = toggle.checked;
        
        // Update detail view toggle state if it is currently open
        if (document.getElementById('views-container').classList.contains('slide-to-detail') && currentDetailPlatform === platform) {
          const detailToggle = document.getElementById('detail-platform-toggle');
          if (detailToggle) detailToggle.checked = toggle.checked;
        }

        saveSettings();
        
        if (!toggle.checked) {
          finalizeSession([getDomainFromPlatform(platform)]);
          reloadTabIfOnDomain(getDomainFromPlatform(platform));
        }
      }
    });
  });

  // 4. PLATFORM SETTINGS CLICK -> NAVIGATION TO DETAIL VIEW
  const settingsButtons = document.querySelectorAll('.btn-platform-settings');
  settingsButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Dismiss first time hint if present
      const youtubeSettings = document.getElementById('settings-youtube');
      if (youtubeSettings && youtubeSettings.classList.contains('pulse-hint')) {
        youtubeSettings.classList.remove('pulse-hint');
        chrome.storage.local.set({ hasSeenFirstTimeHint: true });
      }

      const platform = btn.dataset.platform;
      openPlatformDetailView(platform);
    });
  });

  // Back Button Navigation
  document.getElementById('btn-back-to-main').addEventListener('click', () => {
    document.getElementById('views-container').classList.remove('slide-to-detail');
    // Clear selection highlighting
    document.querySelectorAll('.platform-row').forEach(r => {
      r.classList.remove('row-selected');
    });
  });

  // Open and render specific platform details panel
  function openPlatformDetailView(platform) {
    currentDetailPlatform = platform;
    renderPlatformDetailView(platform);
    
    // Highlight selected platform row
    document.querySelectorAll('.platform-row').forEach(r => {
      r.classList.remove('row-selected');
    });
    const clickedRow = document.getElementById('row-' + platform);
    if (clickedRow) {
      clickedRow.classList.add('row-selected');
    }

    document.getElementById('views-container').classList.add('slide-to-detail');
  }

  // Render detail view headers, options checkboxes
  function renderPlatformDetailView(platform) {
    const nameSpan = document.getElementById('detail-platform-name');
    const iconDiv = document.getElementById('detail-platform-icon');
    const toggleInput = document.getElementById('detail-platform-toggle');
    const listContainer = document.getElementById('detail-checkboxes-list');

    const platformData = settings[platform];
    if (!platformData) return;

    // Set Header Icon and Name dynamically from row properties
    const mainRow = document.getElementById(`row-${platform}`);
    const svgIconHtml = mainRow.querySelector('.platform-icon').innerHTML;
    nameSpan.textContent = mainRow.querySelector('.platform-name').textContent;
    iconDiv.innerHTML = svgIconHtml;

    // Set options container title dynamically
    const optionsTitle = document.getElementById('detail-options-title');
    if (optionsTitle) {
      optionsTitle.textContent = `What to Block on ${nameSpan.textContent}`;
    }

    // Set master switch in detail view
    toggleInput.checked = platformData.enabled !== false;
    
    // Replace toggle listener to clear old event listeners safely
    const newToggleInput = toggleInput.cloneNode(true);
    toggleInput.parentNode.replaceChild(newToggleInput, toggleInput);
    newToggleInput.addEventListener('change', () => {
      platformData.enabled = newToggleInput.checked;
      
      // Update platform row switch
      const mainSwitch = document.getElementById(`toggle-${platform}`);
      if (mainSwitch) {
        mainSwitch.checked = platformData.enabled;
      }

      saveSettings();

      if (!platformData.enabled) {
        finalizeSession([getDomainFromPlatform(platform)]);
        reloadTabIfOnDomain(getDomainFromPlatform(platform));
      }
    });

    // Render checkbox sub-options dynamically
    listContainer.innerHTML = '';
    const options = platformOptionsDef[platform] || [];
    options.forEach(opt => {
      const label = document.createElement('label');
      label.className = 'checkbox-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = platformData[opt.key] !== false;
      
      checkbox.addEventListener('change', () => {
        platformData[opt.key] = checkbox.checked;
        saveSettings();
      });
      
      const spanBox = document.createElement('span');
      spanBox.className = 'checkbox-box';
      
      const spanLabel = document.createElement('span');
      spanLabel.className = 'checkbox-label';
      spanLabel.textContent = opt.label;
      
      label.appendChild(checkbox);
      label.appendChild(spanBox);
      label.appendChild(spanLabel);
      
      listContainer.appendChild(label);
    });

    // Render dynamic Block Full Site button in footer
    const footerContainer = document.getElementById('detail-actions-footer');
    if (footerContainer) {
      footerContainer.innerHTML = '';
      
      const isBlocked = platformData.blockFullSite === true;
      const btn = document.createElement('button');
      btn.className = 'btn-block-full-platform ' + (isBlocked ? 'unblock-mode' : 'block-mode');
      
      if (isBlocked) {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <span>Unblock Full Site</span>
        `;
      } else {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ban" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
          <span>Block Full Site</span>
        `;
      }
      
      btn.addEventListener('click', () => {
        platformData.blockFullSite = !isBlocked;
        saveSettings();
        renderPlatformDetailView(platform);
        if (isBlocked) {
          // Was blocked, now unblocking — finalize session
          finalizeSession([getDomainFromPlatform(platform)]);
        }
        reloadTabIfOnDomain(getDomainFromPlatform(platform));
      });
      
      footerContainer.appendChild(btn);
    }
  }

  // 5. CUSTOM SITES LOGIC

  function renderCustomSites() {
    elements.customSitesList.innerHTML = '';
    const footerContainer = document.getElementById('custom-sites-footer');
    if (footerContainer) footerContainer.innerHTML = '';

    if (isCustomSitesExpanded) {
      elements.customSitesList.classList.add('expanded');
    } else {
      elements.customSitesList.classList.remove('expanded');
    }
    
    if (!settings.customSites || settings.customSites.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'custom-site-url';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.padding = '8px';
      emptyMsg.style.color = 'var(--text-muted)';
      emptyMsg.textContent = 'No custom sites added';
      elements.customSitesList.appendChild(emptyMsg);
      return;
    }

    // Sort list by newest first (reverse order)
    const list = [...settings.customSites].reverse();
    
    // Check if we slice it
    const showLimit = 3;
    const hasMore = list.length > showLimit;
    const visibleSites = (!isCustomSitesExpanded && hasMore) ? list.slice(0, showLimit) : list;

    visibleSites.forEach(site => {
      const item = document.createElement('div');
      item.className = 'custom-site-item';
      
      const urlSpan = document.createElement('span');
      urlSpan.className = 'custom-site-url';
      urlSpan.textContent = site.domain;
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'custom-site-actions';
      
      // Toggle Switch
      const label = document.createElement('label');
      label.className = 'switch';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = site.enabled !== false;
      checkbox.disabled = !settings.masterToggle;
      checkbox.addEventListener('change', () => {
        site.enabled = checkbox.checked;
        saveSettings();
        updateCurrentSiteUI();
        if (!site.enabled) {
          finalizeSession([site.domain]);
          reloadTabIfOnDomain(site.domain);
        }
      });
      
      const slider = document.createElement('span');
      slider.className = 'slider';
      
      label.appendChild(checkbox);
      label.appendChild(slider);
      
      // Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.disabled = !settings.masterToggle;
      deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';
      deleteBtn.title = 'Remove';
      deleteBtn.addEventListener('click', () => {
        const deletedSite = settings.customSites.find(s => s.id === site.id);
        settings.customSites = settings.customSites.filter(s => s.id !== site.id);
        saveSettings();
        renderCustomSites();
        updateCurrentSiteUI();
        if (deletedSite) {
          finalizeSession([deletedSite.domain]);
          reloadTabIfOnDomain(deletedSite.domain);
        }
      });
      
      actionsDiv.appendChild(label);
      actionsDiv.appendChild(deleteBtn);
      
      item.appendChild(urlSpan);
      item.appendChild(actionsDiv);
      
      elements.customSitesList.appendChild(item);
    });

    // Render View All / Show Less button
    if (hasMore && footerContainer) {
      const btn = document.createElement('button');
      btn.className = 'btn-view-all-custom';
      btn.textContent = isCustomSitesExpanded ? 'Show less' : 'View all';
      btn.addEventListener('click', () => {
        isCustomSitesExpanded = !isCustomSitesExpanded;
        renderCustomSites();
      });
      footerContainer.appendChild(btn);
    }
  }


  // 6. DETECT CURRENT SITE LOGIC
  function detectCurrentSite() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          if (url.protocol.startsWith('http')) {
            currentSiteHostname = url.hostname.replace('www.', '').toLowerCase();
            updateCurrentSiteUI();
          } else if (url.protocol.startsWith('chrome-extension') && url.pathname.includes('blocked.html')) {
            const params = new URLSearchParams(url.search);
            const siteParam = params.get('site');
            if (siteParam) {
              currentSiteHostname = siteParam.replace('www.', '').toLowerCase();
              updateCurrentSiteUI();
            }
          }
        } catch (e) {
          console.error('Error detecting current site:', e);
        }
      }
    });
  }

  function getPlatformFromHostname(hostname) {
    if (hostname.includes('youtube.com')) return 'youtube';
    if (hostname.includes('facebook.com') || hostname.includes('messenger.com')) return 'facebook';
    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('reddit.com')) return 'reddit';
    if (hostname.includes('tiktok.com')) return 'tiktok';
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
    return null;
  }

  // Update current site block status card
  function updateCurrentSiteUI() {
    const section = document.getElementById('current-site-section');
    const favicon = document.getElementById('current-site-favicon');
    const nameSpan = document.getElementById('current-site-name');
    const actionWrapper = document.getElementById('current-site-action-wrapper');

    if (!section || !currentSiteHostname) return;

    section.style.display = 'flex';
    nameSpan.textContent = currentSiteHostname;
    favicon.src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent('https://' + currentSiteHostname)}&size=32`;
    favicon.onerror = () => {
      favicon.src = 'icons/icon16.png';
    };

    // Check if it's already managed by FocusShield platforms
    const defaultSites = ['youtube.com', 'facebook.com', 'messenger.com', 'twitter.com', 'x.com', 'reddit.com', 'instagram.com', 'tiktok.com'];
    const isDefault = defaultSites.some(site => currentSiteHostname === site || currentSiteHostname.endsWith('.' + site));

    if (isDefault) {
      actionWrapper.innerHTML = `
        <div class="current-site-managed">
          <span>Already managed</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
      `;
      return;
    }

    const siteConfig = settings.customSites.find(s => s.domain.toLowerCase() === currentSiteHostname);
    const isBlocked = siteConfig && siteConfig.enabled !== false;

    if (isBlocked) {
      actionWrapper.innerHTML = `
        <button class="btn-unblock-site" id="btn-unblock-current">Unblock This Site</button>
      `;
      
      document.getElementById('btn-unblock-current').addEventListener('click', () => {
        finalizeSession([currentSiteHostname]);
        settings.customSites = settings.customSites.filter(s => s.domain.toLowerCase() !== currentSiteHostname);
        saveSettings();
        renderCustomSites();
        updateCurrentSiteUI();
        reloadTabIfOnDomain(currentSiteHostname);
      });
    } else {
      actionWrapper.innerHTML = `
        <button class="btn-block-site" id="btn-block-current"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ban" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>Block This Site</button>
      `;

      document.getElementById('btn-block-current').addEventListener('click', () => {
        const alreadyExists = settings.customSites.some(s => s.domain.toLowerCase() === currentSiteHostname);
        if (!alreadyExists) {
          settings.customSites.push({
            id: Date.now().toString(),
            domain: currentSiteHostname,
            enabled: true
          });
        } else {
          const siteRef = settings.customSites.find(s => s.domain.toLowerCase() === currentSiteHostname);
          if (siteRef) siteRef.enabled = true;
        }
        
        saveSettings();
        renderCustomSites();
        updateCurrentSiteUI();
      });
    }
  }
});
