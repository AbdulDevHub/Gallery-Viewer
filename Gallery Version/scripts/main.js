document.addEventListener("DOMContentLoaded", () => {
  // =============================================================================
  // ELEMENT SELECTORS
  // =============================================================================
  
  const elements = {
    // Containers
    imageContainer: document.getElementById("imageContainer"),
    buttonContainer: document.getElementById("buttonContainer"),
    overlay: document.getElementById("overlay"),
    overlayImage: document.getElementById("overlayImage"),
    zoomLens: document.getElementById("zoomLens"),
    sideMenu: document.getElementById("sideMenu"),
    mainSideMenu: document.getElementById("mainSideMenu"),
    pageInfo: document.getElementById("pageInfo"),
    pageTotal: document.getElementById("pageTotal"),
    mainPageInfo: document.getElementById("mainPageInfo"),
    mainPageTotal: document.getElementById("mainPageTotal"),
    scrollToTopBtn: document.getElementById("scrollToTopBtn"),

    // File inputs
    fileInput: document.getElementById("fileInput"),
    folderInput: document.getElementById("folderInput"),

    // Grid buttons
    twelvePerRowBtn: document.getElementById("twelvePerRow"),
    sixPerRowBtn: document.getElementById("sixPerRow"),
    threePerRowBtn: document.getElementById("threePerRow"),
    onePerRowBtn: document.getElementById("onePerRow"),

    // Control buttons
    clearAllBtn: document.getElementById("clearAll"),
    zoomInBtn: document.getElementById("zoomIn"),
    zoomOutBtn: document.getElementById("zoomOut"),
    zoomModeBtn: document.getElementById("zoomMode"),
    mainToggleGapBtn: document.getElementById("mainToggleGap"),
    toggleImageFillBtn: document.getElementById("toggleImageFill"),
    randomizeBtn: document.getElementById("randomize"),
    spotlightBtn: document.getElementById("spotlight"),
    fullScreenBtn: document.getElementById("fullScreen"),
    mainZoomInBtn: document.getElementById("mainZoomIn"),
    mainZoomOutBtn: document.getElementById("mainZoomOut"),
    mainFullScreenBtn: document.getElementById("mainFullScreen"),

    // Menu buttons
    fullBtn: document.getElementById("fullBtn"),
    eightyBtn: document.getElementById("eightyBtn"),
    autoBtn: document.getElementById("autoBtn"),
    saveBtn: document.getElementById("saveBtn")
  }

  // =============================================================================
  // STATE VARIABLES
  // =============================================================================
  
  const state = {
    imageData: [],
    imageUrls: [],
    currentIndex: -1,
    selectedImageCount: 3,
    zoomMode: 0, // 0: Deactivated, 1: Magnifying Glass, 2: Zoom Lens
    isRandomized: false,
    isWidthLimited: false,
    isAutoMode: true,
    currentFolderName: null,
    isFromFolder: false,
    currentVisibleIndex: -1, // Track currently visible image in grid
    intersectionObserver: null,
    hasGap: true,
    isForceFillWidth: true
  }

  // =============================================================================
  // LOCAL STORAGE FUNCTIONS
  // =============================================================================
  
  function saveBookmark() {
    if (!state.isFromFolder || !state.currentFolderName) {
      alert("Bookmarks can only be saved for folder uploads!")
      return
    }

    if (state.currentIndex === -1 || state.imageUrls.length === 0) {
      alert("No image to bookmark!")
      return
    }

    try {
      const bookmarks = JSON.parse(localStorage.getItem("galleryBookmarks") || "{}")
      bookmarks[state.currentFolderName] = state.currentIndex + 1
      localStorage.setItem("galleryBookmarks", JSON.stringify(bookmarks))
      
      // Visual feedback
      const saveBtn = elements.saveBtn
      const originalContent = saveBtn.innerHTML
      saveBtn.innerHTML = "✅"
      saveBtn.style.backgroundColor = "#4CAF50"
      
      setTimeout(() => {
        saveBtn.innerHTML = originalContent
        saveBtn.style.backgroundColor = ""
      }, 1000)
      
      console.log(`Bookmark saved: ${state.currentFolderName} - Page ${state.currentIndex + 1}`)
    } catch (error) {
      console.error("Error saving bookmark:", error)
      alert("Failed to save bookmark!")
    }
  }

  function loadBookmark(folderName) {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("galleryBookmarks") || "{}")
      const savedPage = bookmarks[folderName]
      
      if (savedPage && savedPage >= 1 && savedPage <= state.imageUrls.length) {
        console.log(`Loading bookmark: ${folderName} - Page ${savedPage}`)
        return savedPage - 1
      }
    } catch (error) {
      console.error("Error loading bookmark:", error)
    }
    
    return null
  }

  function getFolderNameFromPath(path) {
    const parts = path.split(/[/\\]/)
    
    for (let i = parts.length - 2; i >= 0; i--) {
      if (parts[i] && parts[i].trim() !== "") {
        return parts[i]
      }
    }
    
    return null
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  function updatePageInfo() {
    const { currentIndex, imageUrls, currentVisibleIndex } = state
    
    // For overlay mode, show current overlay image
    if (elements.overlay.style.display === "flex") {
      const displayPage = imageUrls.length > 0 ? currentIndex + 1 : 0
      elements.pageInfo.value = displayPage
      elements.pageTotal.textContent = imageUrls.length
    }
    
    // For main grid view, show currently visible image
    const mainDisplayPage = imageUrls.length > 0 && currentVisibleIndex >= 0 
      ? currentVisibleIndex + 1 
      : 0
    const totalPages = imageUrls.length
    
    elements.mainPageInfo.value = mainDisplayPage
    elements.mainPageTotal.textContent = totalPages
  }

  function handlePageInfoInput() {
    const input = elements.pageInfo.value.trim()
    const pageNumber = parseInt(input)
    
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= state.imageUrls.length) {
      state.currentIndex = pageNumber - 1
      showImageInOverlay(state.imageUrls[state.currentIndex])
    } else {
      updatePageInfo()
    }
  }

  function setupPageInfoInput() {
    elements.pageInfo.addEventListener('click', () => {
      elements.pageInfo.select()
    })

    elements.pageInfo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handlePageInfoInput()
        elements.pageInfo.blur()
      } else if (e.key === 'Escape') {
        updatePageInfo()
        elements.pageInfo.blur()
      }
    })

    elements.pageInfo.addEventListener('blur', handlePageInfoInput)
  }

  function handleMainPageInfoInput() {
    const input = elements.mainPageInfo.value.trim()
    const pageNumber = parseInt(input)
    
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= state.imageUrls.length) {
      const targetIndex = pageNumber - 1
      const images = elements.imageContainer.querySelectorAll('img')
      if (images[targetIndex]) {
        images[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } else {
      updatePageInfo()
    }
  }

  function setupMainPageInfoInput() {
    elements.mainPageInfo.addEventListener('click', () => {
      elements.mainPageInfo.select()
    })

    elements.mainPageInfo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleMainPageInfoInput()
        elements.mainPageInfo.blur()
      } else if (e.key === 'Escape') {
        updatePageInfo()
        elements.mainPageInfo.blur()
      }
    })

    elements.mainPageInfo.addEventListener('blur', handleMainPageInfoInput)
  }

  function applyAutoSize() {
    const ratio = elements.overlayImage.naturalWidth / elements.overlayImage.naturalHeight
    const isLandscape = ratio >= 1.2

    elements.overlayImage.classList.toggle("width-limited", !isLandscape)
    elements.overlay.classList.toggle("width-limited-mode", !isLandscape)
    
    if (!isLandscape) {
      elements.overlay.scrollTop = 0
    }
  }

  function shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  function clearAll() {
    elements.imageContainer.innerHTML = ""
    state.imageData = []
    state.imageUrls = []
    state.currentIndex = -1
    state.currentFolderName = null
    state.isFromFolder = false
    state.currentVisibleIndex = -1
    
    // Cleanup observer
    if (state.intersectionObserver) {
      state.intersectionObserver.disconnect()
      state.intersectionObserver = null
    }
    
    updatePageInfo()
  }

  function clearMenuSelection() {
    [elements.fullBtn, elements.eightyBtn, elements.autoBtn].forEach(btn => 
      btn.classList.remove("selectedGridOption")
    )
  }

  function clearGridSelection() {
    elements.buttonContainer.querySelectorAll("button").forEach(button => 
      button.classList.remove("selectedGridOption")
    )
  }

  // =============================================================================
  // IMAGE DISPLAY AND MANAGEMENT
  // =============================================================================
  
  function setupIntersectionObserver() {
    // Cleanup existing observer
    if (state.intersectionObserver) {
      state.intersectionObserver.disconnect()
    }

    // Create new observer to track visible images
    state.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const index = parseInt(entry.target.dataset.imageIndex)
          if (!isNaN(index) && index !== state.currentVisibleIndex) {
            state.currentVisibleIndex = index
            updatePageInfo()
          }
        }
      })
    }, {
      threshold: [0.5],
      rootMargin: '0px'
    })
  }

  function refreshImageDisplay() {
    elements.imageContainer.innerHTML = ""
    
    if (state.imageData.length === 0) {
      state.currentVisibleIndex = -1
      updatePageInfo()
      return
    }
    
    const displayOrder = state.isRandomized 
      ? shuffleArray(state.imageData)
      : [...state.imageData].sort((a, b) => a.order - b.order)
    
    state.imageUrls = displayOrder.map(item => item.url)
    
    // Setup observer for tracking visible images
    setupIntersectionObserver()
    
    displayOrder.forEach((item, index) => {
      const img = document.createElement("img")
      Object.assign(img, {
        src: item.url,
        alt: item.alt,
        loading: "lazy",
        title: item.title || ""
      })
      
      // Add data attribute for tracking
      img.dataset.imageIndex = index
      
      // Observe this image
      state.intersectionObserver.observe(img)
      
      img.addEventListener("click", () => {
        if (state.isFromFolder && state.currentFolderName) {
          const bookmarkedIndex = loadBookmark(state.currentFolderName)
          if (bookmarkedIndex !== null) {
            state.currentIndex = bookmarkedIndex
            showImageInOverlay(state.imageUrls[state.currentIndex])
            return
          }
        }
        
        state.currentIndex = index
        showImageInOverlay(item.url)
      })
      
      elements.imageContainer.appendChild(img)
    })
    
    if (state.currentIndex >= state.imageUrls.length) {
      state.currentIndex = 0
    }
    if (state.currentIndex === -1 && state.imageUrls.length > 0) {
      state.currentIndex = 0
    }
    
    // Reset visible index
    state.currentVisibleIndex = -1
    updatePageInfo()
  }

  // =============================================================================
  // FILE PROCESSING
  // =============================================================================
  
  async function processFiles(files, isFromFolderUpload = false) {
    state.isFromFolder = isFromFolderUpload
    
    if (isFromFolderUpload && files.length > 0) {
      const firstFile = files[0]
      if (firstFile.webkitRelativePath) {
        state.currentFolderName = getFolderNameFromPath(firstFile.webkitRelativePath)
        console.log("Folder detected:", state.currentFolderName)
      }
    } else {
      state.currentFolderName = null
    }

    const sortedFiles = [...files].sort((a, b) => {
      const aMatch = a.name.match(/^(\d+)/)
      const bMatch = b.name.match(/^(\d+)/)
      
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1])
      }
      
      return a.name.localeCompare(b.name)
    })

    for (const file of sortedFiles) {
      if (file.type.startsWith("image/")) {
        await handleImageFile(file)
      } else if (file.type.startsWith("video/")) {
        await handleVideoFile(file)
      }
    }
    
    refreshImageDisplay()
  }

  function handleImageFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        state.imageData.push({
          url: e.target.result,
          alt: file.name,
          title: null,
          order: state.imageData.length
        })
        
        if (state.currentIndex === -1) {
          state.currentIndex = 0
        }
        
        resolve()
      }
      
      reader.readAsDataURL(file)
    })
  }

  async function handleVideoFile(file) {
    const video = document.createElement("video")
    video.src = URL.createObjectURL(file)
    video.preload = "metadata"

    await new Promise((resolve) => {
      video.addEventListener("loadedmetadata", resolve, { once: true })
    })

    const timestamps = generateTimestamps(video.duration, state.selectedImageCount)
    
    for (let i = 0; i < timestamps.length; i++) {
      await captureFrameAtTime(video, timestamps[i], i, file.name)
    }

    URL.revokeObjectURL(video.src)
    video.remove()
  }

  function generateTimestamps(duration, count) {
    if (count === 1) return [duration / 2]
    
    const interval = 1 / (count + 1)
    return Array.from({ length: count }, (_, i) => duration * ((i + 1) * interval))
  }

  function captureFrameAtTime(video, time, index, fileName) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      video.currentTime = time

      const onSeeked = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        state.imageData.push({
          url: canvas.toDataURL("image/png"),
          alt: `${fileName} - Frame ${index + 1}`,
          title: fileName.replace(/\.[^/.]+$/, ""),
          order: state.imageData.length
        })
        
        if (state.currentIndex === -1) {
          state.currentIndex = 0
        }

        video.removeEventListener("seeked", onSeeked)
        resolve()
      }

      video.addEventListener("seeked", onSeeked, { once: true })
    })
  }

  // =============================================================================
  // GRID AND LAYOUT CONTROLS
  // =============================================================================
  
  function toggleGrid(className, selectedCount) {
    state.selectedImageCount = selectedCount
    elements.imageContainer.className = `image-container ${className}`

    // Reset actual-width toggle when leaving one-per-row
    if (className !== "one-per-row") {
      elements.imageContainer.classList.remove("actual-width")
    }

    const buttonMap = {
      "twelve-per-row": elements.twelvePerRowBtn,
      "six-per-row": elements.sixPerRowBtn,
      "three-per-row": elements.threePerRowBtn,
      "one-per-row": elements.onePerRowBtn
    }

    clearGridSelection()
    buttonMap[className].classList.add("selectedGridOption")
  }

  function handleImageContainerWidth(delta) {
    const currentWidth = parseFloat(elements.imageContainer.style.maxWidth) || 90
    const newWidth = delta > 0 
      ? Math.min(currentWidth + 10, 100)
      : Math.max(currentWidth - 10, 10)
    
    elements.imageContainer.style.maxWidth = `${newWidth}%`
  }

  function toggleRandomize() {
    state.isRandomized = !state.isRandomized
    elements.randomizeBtn.classList.toggle("selectedGridOption", state.isRandomized)
    refreshImageDisplay()
  }

  function toggleGap() {
    state.hasGap = !state.hasGap
    elements.imageContainer.classList.toggle("no-gap", !state.hasGap)
    elements.mainToggleGapBtn.classList.toggle("selectedGridOption", state.hasGap)
  }

  function toggleImageFillWidth() {
    state.isForceFillWidth = !state.isForceFillWidth

    elements.imageContainer.classList.toggle(
      "actual-width",
      !state.isForceFillWidth
    )

    elements.toggleImageFillBtn.classList.toggle(
      "selectedGridOption",
      state.isForceFillWidth
    )
  }

  // =============================================================================
  // OVERLAY AND NAVIGATION
  // =============================================================================
  
  function showImageInOverlay(src) {
    // Save scroll position
    state.savedScrollPosition =
      window.pageYOffset || document.documentElement.scrollTop

    // Lock body scroll (safe method)
    document.body.classList.add("overlay-open")
    document.body.style.top = `-${state.savedScrollPosition}px`

    // Show overlay
    elements.overlayImage.src = src
    elements.overlay.style.display = "flex"
    elements.sideMenu.style.display = "block"

    elements.overlayImage.onload = () => {
      elements.overlayImage.classList.remove("tall")

      const renderedHeight =
        elements.overlayImage.getBoundingClientRect().height

      if (renderedHeight > window.innerHeight) {
        elements.overlayImage.classList.add("tall")
      }

      if (state.isAutoMode) {
        applyAutoSize()
      }
    }

    if (!state.isAutoMode) {
      const shouldLimit = state.isWidthLimited
      elements.overlayImage.classList.toggle("width-limited", shouldLimit)
      elements.overlay.classList.toggle("width-limited-mode", shouldLimit)

      if (shouldLimit) {
        elements.overlay.scrollTop = 0
      }
    }

    updatePageInfo()
    applyZoomMode()
  }

  function hideOverlay() {
    const savedScroll = state.savedScrollPosition || 0

    elements.overlay.style.display = "none"
    elements.overlay.classList.remove("width-limited-mode")
    elements.sideMenu.style.display = "none"
    elements.sideMenu.classList.remove("visible")

    elements.overlayImage.src = ""
    elements.overlayImage.classList.remove("width-limited")
    elements.overlayImage.classList.remove("tall")
    elements.overlayImage.style.transform = "none"

    elements.zoomLens.style.display = "none"

    // Unlock body scroll
    document.body.classList.remove("overlay-open")
    document.body.style.top = ""

    // Restore scroll
    window.scrollTo(0, savedScroll)

    deactivateZoom()
  }

  function showNextImage() {
    if (state.imageUrls.length > 0) {
      state.currentIndex = (state.currentIndex + 1) % state.imageUrls.length
      showImageInOverlay(state.imageUrls[state.currentIndex])
    }
  }

  function showPreviousImage() {
    if (state.imageUrls.length > 0) {
      state.currentIndex = (state.currentIndex - 1 + state.imageUrls.length) % state.imageUrls.length
      showImageInOverlay(state.imageUrls[state.currentIndex])
    }
  }

  // =============================================================================
  // ZOOM FUNCTIONALITY
  // =============================================================================
  
  function toggleZoomMode() {
    state.zoomMode = (state.zoomMode + 1) % 3
    
    const zoomModeBtn = elements.zoomModeBtn
    const overlayImage = elements.overlayImage

    const zoomModes = [
      { outline: "", icon: "🔍", cursor: "default", activate: deactivateZoom },
      { outline: "#f3c669 2px solid", icon: "🔍", cursor: "zoom-in", activate: activateMagnifyingZoom },
      { outline: "#f3c669 2px solid", icon: "🔬", cursor: "crosshair", activate: activateZoomLens }
    ]

    const mode = zoomModes[state.zoomMode]
    zoomModeBtn.style.outline = mode.outline
    zoomModeBtn.innerHTML = `<span>${mode.icon}</span>`
    overlayImage.style.cursor = mode.cursor
    mode.activate()
  }

  function applyZoomMode() {
    const modes = [
      { cursor: "default", activate: deactivateZoom },
      { cursor: "zoom-in", activate: activateMagnifyingZoom },
      { cursor: "crosshair", activate: activateZoomLens }
    ]

    const mode = modes[state.zoomMode]
    elements.overlayImage.style.cursor = mode.cursor
    mode.activate()
    elements.zoomLens.style.display = "none"
  }

  function deactivateZoom() {
    const overlayImage = elements.overlayImage
    
    overlayImage.removeEventListener("click", handleZoomClick)
    overlayImage.removeEventListener("mousemove", handleZoomLensMove)
    overlayImage.removeEventListener("mouseenter", showLens)
    overlayImage.removeEventListener("mouseleave", hideLens)

    elements.zoomLens.style.display = "none"
    overlayImage.style.transform = "none"
  }

  function activateMagnifyingZoom() {
    const overlayImage = elements.overlayImage
    
    overlayImage.addEventListener("click", handleZoomClick)
    overlayImage.removeEventListener("mousemove", handleZoomLensMove)
    elements.zoomLens.style.display = "none"
  }

  function activateZoomLens() {
    const overlayImage = elements.overlayImage
    
    overlayImage.removeEventListener("click", handleZoomClick)
    overlayImage.addEventListener("mousemove", handleZoomLensMove)
    overlayImage.addEventListener("mouseenter", showLens)
    overlayImage.addEventListener("mouseleave", hideLens)
  }

  function handleZoomClick(event) {
    const overlayImage = elements.overlayImage
    
    if (overlayImage.style.cursor === "zoom-in") {
      zoomInImage(event)
      overlayImage.style.cursor = "zoom-out"
    } else {
      zoomOutImage()
      overlayImage.style.cursor = "zoom-in"
    }
  }

  function handleZoomLensMove(event) {
    const rect = elements.overlayImage.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const lensSize = 175
    const scale = 2

    const zoomLens = elements.zoomLens
    const overlayImage = elements.overlayImage

    Object.assign(zoomLens.style, {
      width: `${lensSize}px`,
      height: `${lensSize}px`,
      left: `${x - lensSize / 2}px`,
      top: `${y - lensSize / 2}px`,
      display: "block",
      backgroundImage: `url(${overlayImage.src})`,
      backgroundSize: `${overlayImage.width * scale}px ${overlayImage.height * scale}px`,
      backgroundPosition: `-${x * scale - lensSize / 2}px -${y * scale - lensSize / 2}px`
    })
  }

  function showLens() {
    elements.zoomLens.style.display = "block"
  }

  function hideLens() {
    elements.zoomLens.style.display = "none"
  }

  function zoomInImage(event) {
    const rect = elements.overlayImage.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const scale = 2

    const overlayImage = elements.overlayImage
    overlayImage.style.transformOrigin = `${x}px ${y}px`
    overlayImage.style.transform = `scale(${scale})`
  }

  function zoomOutImage() {
    const overlayImage = elements.overlayImage
    overlayImage.style.transform = "none"
    overlayImage.style.transformOrigin = "center center"
  }

  // =============================================================================
  // HORIZONTAL TO VERTICAL SCROLL REMAPPER
  // =============================================================================
  
  function setupHorizontalScrollRemapper() {
    window.addEventListener("wheel", (e) => {
      // Only remap horizontal scroll when NOT in overlay mode
      const isOverlayOpen = elements.overlay.style.display === "flex"
      
      if (!isOverlayOpen && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        // Scroll both body and documentElement for cross-browser compatibility
        const scrollAmount = e.deltaX
        window.scrollBy(0, scrollAmount)
        document.documentElement.scrollTop += scrollAmount
        document.body.scrollTop += scrollAmount
      }
    }, { passive: false })
    
    // Add separate handler for overlay scrolling
    elements.overlay.addEventListener("wheel", (e) => {
      // In overlay mode, remap horizontal scroll to vertical scroll on the overlay
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        e.stopPropagation() // Prevent event from bubbling to window
        elements.overlay.scrollBy(0, e.deltaX)
      }
    }, { passive: false })
  }

  // =============================================================================
  // CONTROL FUNCTIONS
  // =============================================================================
  
  function toggleSpotlight() {
    const isHidden = elements.buttonContainer.style.display === "none"
    
    elements.buttonContainer.style.display = isHidden ? "flex" : "none"
    document.body.style.overflow = isHidden ? "auto" : "hidden"
  }

  function toggleFullScreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  function setupScrollToTop() {
    let lastScrollTop = 0
    
    window.addEventListener("scroll", () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      
      elements.scrollToTopBtn.style.display = scrollTop > lastScrollTop ? "none" : "block"
      lastScrollTop = Math.max(scrollTop, 0)
    })

    elements.scrollToTopBtn.addEventListener("click", () => {
      document.body.scrollTop = 0
      document.documentElement.scrollTop = 0
    })
  }

  function setupSideMenuToggle(menuElement) {
    document.addEventListener("mousemove", (e) => {
      const menuRect = menuElement.getBoundingClientRect()
      const showMenu = e.clientX < 50 || (
        e.clientX >= menuRect.left &&
        e.clientX <= menuRect.right &&
        e.clientY >= menuRect.top &&
        e.clientY <= menuRect.bottom
      )
      
      menuElement.classList.toggle("visible", showMenu)
    })
  }

  // =============================================================================
  // OVERLAY SIZE MODE CONTROL
  // =============================================================================
  
  function setOverlaySizeMode(mode) {
    clearMenuSelection()
    
    const modes = {
      full: { widthLimited: false, autoMode: false, button: elements.fullBtn },
      eighty: { widthLimited: true, autoMode: false, button: elements.eightyBtn },
      auto: { widthLimited: false, autoMode: true, button: elements.autoBtn }
    }

    const selectedMode = modes[mode]
    selectedMode.button.classList.add("selectedGridOption")
    state.isAutoMode = selectedMode.autoMode
    state.isWidthLimited = selectedMode.widthLimited

    if (mode === "auto") {
      applyAutoSize()
    } else {
      elements.overlayImage.classList.toggle("width-limited", selectedMode.widthLimited)
      elements.overlay.classList.toggle("width-limited-mode", selectedMode.widthLimited)
      
      if (selectedMode.widthLimited) {
        elements.overlay.scrollTop = 0
      }
    }
    
    updatePageInfo()
  }

  // =============================================================================
  // EVENT LISTENERS
  // =============================================================================
  
  function setupEventListeners() {
    // File inputs
    elements.fileInput.addEventListener("change", (e) => processFiles(Array.from(e.target.files), false))
    elements.folderInput.addEventListener("change", (e) => processFiles(Array.from(e.target.files), true))
    elements.fileInput.addEventListener("click", () => { elements.fileInput.value = "" })
    elements.folderInput.addEventListener("click", () => { elements.folderInput.value = "" })

    // Control buttons
    elements.clearAllBtn.addEventListener("click", clearAll)
    elements.randomizeBtn.addEventListener("click", toggleRandomize)
    elements.mainToggleGapBtn.addEventListener("click", toggleGap)
    elements.toggleImageFillBtn.addEventListener("click", toggleImageFillWidth)
    elements.zoomInBtn.addEventListener("click", () => handleImageContainerWidth(10))
    elements.zoomOutBtn.addEventListener("click", () => handleImageContainerWidth(-10))
    elements.mainZoomInBtn.addEventListener("click", () => handleImageContainerWidth(10))
    elements.mainZoomOutBtn.addEventListener("click", () => handleImageContainerWidth(-10))
    elements.zoomModeBtn.addEventListener("click", toggleZoomMode)
    elements.spotlightBtn.addEventListener("click", toggleSpotlight)
    elements.fullScreenBtn.addEventListener("click", toggleFullScreen)
    elements.mainFullScreenBtn.addEventListener("click", toggleFullScreen)
    elements.saveBtn.addEventListener("click", saveBookmark)

    // Grid buttons
    elements.twelvePerRowBtn.addEventListener("click", () => toggleGrid("twelve-per-row", 12))
    elements.sixPerRowBtn.addEventListener("click", () => toggleGrid("six-per-row", 6))
    elements.threePerRowBtn.addEventListener("click", () => toggleGrid("three-per-row", 3))
    elements.onePerRowBtn.addEventListener("click", () => toggleGrid("one-per-row", 1))

    // Menu buttons - now using unified function
    elements.fullBtn.addEventListener("click", () => setOverlaySizeMode("full"))
    elements.eightyBtn.addEventListener("click", () => setOverlaySizeMode("eighty"))
    elements.autoBtn.addEventListener("click", () => setOverlaySizeMode("auto"))

    // Overlay events
    elements.overlay.addEventListener("click", (event) => {
      if (event.target === elements.overlay) hideOverlay()
    })
    
    elements.overlayImage.addEventListener("click", (event) => {
      event.stopPropagation()
      showNextImage()
    })

    // Keyboard events
    const keyHandlers = {
      "Escape": hideOverlay,
      "ArrowRight": showNextImage,
      "ArrowLeft": showPreviousImage,
      "z": toggleZoomMode,
      "r": toggleRandomize,
      "g": toggleGap,
      "h": toggleSpotlight,
      "f": toggleFullScreen,
      "s": saveBookmark,
      "+": () => handleImageContainerWidth(10),
      "=": () => handleImageContainerWidth(10),
      "-": () => handleImageContainerWidth(-10)
    }

    document.addEventListener("keydown", (event) => {
      const handler = keyHandlers[event.key]
      if (handler) handler()
    })
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================
  
  function init() {
    setupEventListeners()
    setupScrollToTop()
    setupSideMenuToggle(elements.sideMenu)
    setupSideMenuToggle(elements.mainSideMenu)
    setupPageInfoInput()
    setupMainPageInfoInput()
    setupHorizontalScrollRemapper()
    updatePageInfo()
  }

  init()
})