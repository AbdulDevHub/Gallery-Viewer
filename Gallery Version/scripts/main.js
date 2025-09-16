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
    pageInfo: document.getElementById("pageInfo"),
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
    randomizeBtn: document.getElementById("randomize"),
    spotlightBtn: document.getElementById("spotlight"),
    fullScreenBtn: document.getElementById("fullScreen"),

    // Menu buttons
    fullBtn: document.getElementById("fullBtn"),
    eightyBtn: document.getElementById("eightyBtn"),
    autoBtn: document.getElementById("autoBtn")
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
    isAutoMode: false
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  function updatePageInfo() {
    const { currentIndex, imageUrls } = state
    elements.pageInfo.textContent = imageUrls.length > 0 
      ? `${currentIndex + 1} / ${imageUrls.length}` 
      : "0 / 0"
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
    updatePageInfo()
  }

  function clearMenuSelection() {
    const menuButtons = [elements.fullBtn, elements.eightyBtn, elements.autoBtn]
    menuButtons.forEach(btn => btn.classList.remove("selectedGridOption"))
  }

  function clearGridSelection() {
    const gridButtons = elements.buttonContainer.querySelectorAll("button")
    gridButtons.forEach(button => button.classList.remove("selectedGridOption"))
  }

  // =============================================================================
  // IMAGE DISPLAY AND MANAGEMENT
  // =============================================================================
  
  function refreshImageDisplay() {
    elements.imageContainer.innerHTML = ""
    
    if (state.imageData.length === 0) return
    
    const displayOrder = state.isRandomized 
      ? shuffleArray(state.imageData)
      : [...state.imageData].sort((a, b) => a.order - b.order)
    
    state.imageUrls = displayOrder.map(item => item.url)
    
    displayOrder.forEach((item, index) => {
      const img = document.createElement("img")
      Object.assign(img, {
        src: item.url,
        alt: item.alt,
        loading: "lazy",
        title: item.title || ""
      })
      
      img.addEventListener("click", () => {
        state.currentIndex = index
        showImageInOverlay(item.url)
      })
      
      elements.imageContainer.appendChild(img)
    })
    
    // Reset current index if needed
    if (state.currentIndex >= state.imageUrls.length) {
      state.currentIndex = 0
    }
    if (state.currentIndex === -1 && state.imageUrls.length > 0) {
      state.currentIndex = 0
    }
  }

  // =============================================================================
  // FILE PROCESSING
  // =============================================================================
  
  async function processFiles(files) {
    // Sort files numerically by filename
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
        const imageItem = {
          url: e.target.result,
          alt: file.name,
          title: null,
          order: state.imageData.length
        }
        
        state.imageData.push(imageItem)
        
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
    if (count === 1) {
      return [duration / 2]
    }
    
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

        const imageItem = {
          url: canvas.toDataURL("image/png"),
          alt: `${fileName} - Frame ${index + 1}`,
          title: fileName.replace(/\.[^/.]+$/, ""),
          order: state.imageData.length
        }
        
        state.imageData.push(imageItem)
        
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

    const buttonMap = {
      "twelve-per-row": elements.twelvePerRowBtn,
      "six-per-row": elements.sixPerRowBtn,
      "three-per-row": elements.threePerRowBtn,
      "one-per-row": elements.onePerRowBtn
    }

    clearGridSelection()
    buttonMap[className].classList.add("selectedGridOption")
  }

  function handleImageContainerWidth(event) {
    const currentWidth = parseFloat(elements.imageContainer.style.maxWidth) || 90
    
    if (event.key === "=" || event.key === "+" || (event.key === "=" && event.shiftKey)) {
      elements.imageContainer.style.maxWidth = `${Math.min(currentWidth + 10, 100)}%`
    } else if (event.key === "-") {
      elements.imageContainer.style.maxWidth = `${Math.max(currentWidth - 10, 10)}%`
    }
  }

  function toggleRandomize() {
    state.isRandomized = !state.isRandomized
    elements.randomizeBtn.classList.toggle("selectedGridOption", state.isRandomized)
    refreshImageDisplay()
  }

  // =============================================================================
  // OVERLAY AND NAVIGATION
  // =============================================================================
  
  function showImageInOverlay(src) {
    elements.overlayImage.src = src
    elements.overlay.style.display = "flex"
    elements.sideMenu.style.display = "block"

    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"

    elements.overlayImage.onload = () => {
      elements.overlayImage.classList.remove("tall")

      const renderedHeight = elements.overlayImage.getBoundingClientRect().height
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
        setTimeout(() => { elements.overlay.scrollTop = 0 }, 10)
      }
    }

    updatePageInfo()
    applyZoomMode()
  }

  function hideOverlay() {
    elements.overlay.style.display = "none"
    elements.overlay.classList.remove("width-limited-mode")
    elements.sideMenu.style.display = "none"
    elements.sideMenu.classList.remove("visible")
    elements.overlayImage.src = ""
    elements.overlayImage.classList.remove("width-limited")
    elements.zoomLens.style.display = "none"
    elements.overlayImage.style.transform = "none"

    document.body.style.overflow = "auto"
    document.documentElement.style.overflow = "auto"

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

    switch (state.zoomMode) {
      case 0: // Deactivated
        zoomModeBtn.style.outline = ""
        zoomModeBtn.innerHTML = "<span>🔍</span>"
        overlayImage.style.cursor = "default"
        deactivateZoom()
        break

      case 1: // Magnifying Glass Mode
        zoomModeBtn.style.outline = "#f3c669 2px solid"
        zoomModeBtn.innerHTML = "<span>🔍</span>"
        overlayImage.style.cursor = "zoom-in"
        activateMagnifyingZoom()
        break

      case 2: // Zoom Lens Mode
        zoomModeBtn.style.outline = "#f3c669 2px solid"
        zoomModeBtn.innerHTML = "<span>🔬</span>"
        overlayImage.style.cursor = "crosshair"
        activateZoomLens()
        break
    }
  }

  function applyZoomMode() {
    const overlayImage = elements.overlayImage
    
    switch (state.zoomMode) {
      case 0:
        overlayImage.style.cursor = "default"
        deactivateZoom()
        break
      case 1:
        overlayImage.style.cursor = "zoom-in"
        activateMagnifyingZoom()
        break
      case 2:
        overlayImage.style.cursor = "crosshair"
        activateZoomLens()
        break
    }

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
  // CONTROL FUNCTIONS
  // =============================================================================
  
  function toggleSpotlight(event) {
    if (event.key === "h") {
      const isHidden = elements.buttonContainer.style.display === "none"
      
      elements.buttonContainer.style.display = isHidden ? "flex" : "none"
      document.body.style.overflow = isHidden ? "auto" : "hidden"
    }
  }

  function toggleFullScreen(event) {
    if (event.key === "f") {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.documentElement.requestFullscreen()
      }
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

  function setupSideMenuToggle() {
    document.addEventListener("mousemove", (e) => {
      const menuRect = elements.sideMenu.getBoundingClientRect()
      const showMenu = e.clientX < 50 || (
        e.clientX >= menuRect.left &&
        e.clientX <= menuRect.right &&
        e.clientY >= menuRect.top &&
        e.clientY <= menuRect.bottom
      )
      
      elements.sideMenu.classList.toggle("visible", showMenu)
    })
  }

  // =============================================================================
  // EVENT LISTENERS
  // =============================================================================
  
  function setupEventListeners() {
    // File inputs
    elements.fileInput.addEventListener("change", (e) => processFiles(Array.from(e.target.files)))
    elements.folderInput.addEventListener("change", (e) => processFiles(Array.from(e.target.files)))

    // Control buttons
    elements.clearAllBtn.addEventListener("click", clearAll)
    elements.randomizeBtn.addEventListener("click", toggleRandomize)
    elements.zoomInBtn.addEventListener("click", () => handleImageContainerWidth({ key: "+" }))
    elements.zoomOutBtn.addEventListener("click", () => handleImageContainerWidth({ key: "-" }))
    elements.zoomModeBtn.addEventListener("click", toggleZoomMode)
    elements.spotlightBtn.addEventListener("click", () => toggleSpotlight({ key: "h" }))
    elements.fullScreenBtn.addEventListener("click", () => toggleFullScreen({ key: "f" }))

    // Grid buttons
    elements.twelvePerRowBtn.addEventListener("click", () => toggleGrid("twelve-per-row", 12))
    elements.sixPerRowBtn.addEventListener("click", () => toggleGrid("six-per-row", 6))
    elements.threePerRowBtn.addEventListener("click", () => toggleGrid("three-per-row", 3))
    elements.onePerRowBtn.addEventListener("click", () => toggleGrid("one-per-row", 1))

    // Menu buttons
    elements.fullBtn.addEventListener("click", () => {
      clearMenuSelection()
      elements.fullBtn.classList.add("selectedGridOption")
      state.isAutoMode = false
      state.isWidthLimited = false
      elements.overlayImage.classList.remove("width-limited")
      elements.overlay.classList.remove("width-limited-mode")
      updatePageInfo()
    })

    elements.eightyBtn.addEventListener("click", () => {
      clearMenuSelection()
      elements.eightyBtn.classList.add("selectedGridOption")
      state.isAutoMode = false
      state.isWidthLimited = true
      elements.overlayImage.classList.add("width-limited")
      elements.overlay.classList.add("width-limited-mode")
      elements.overlay.scrollTop = 0
      updatePageInfo()
    })

    elements.autoBtn.addEventListener("click", () => {
      clearMenuSelection()
      elements.autoBtn.classList.add("selectedGridOption")
      state.isAutoMode = true
      applyAutoSize()
    })

    // Overlay events
    elements.overlay.addEventListener("click", (event) => {
      if (event.target === elements.overlay) hideOverlay()
    })
    
    elements.overlayImage.addEventListener("click", (event) => {
      event.stopPropagation()
    })

    // Keyboard events
    const keyHandlers = {
      "Escape": hideOverlay,
      "ArrowRight": showNextImage,
      "ArrowLeft": showPreviousImage,
      "z": toggleZoomMode,
      "r": toggleRandomize,
      "h": toggleSpotlight,
      "f": toggleFullScreen,
      "+": handleImageContainerWidth,
      "=": handleImageContainerWidth,
      "-": handleImageContainerWidth
    }

    document.addEventListener("keydown", (event) => {
      const handler = keyHandlers[event.key]
      if (handler) {
        handler(event)
      }
    })
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================
  
  function init() {
    setupEventListeners()
    setupScrollToTop()
    setupSideMenuToggle()
    updatePageInfo()
  }

  init()
})