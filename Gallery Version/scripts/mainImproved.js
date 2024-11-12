document.addEventListener("DOMContentLoaded", () => {
  // Constants
  const ZOOM_MODES = {
    DISABLED: 0,
    MAGNIFYING_GLASS: 1,
    ZOOM_LENS: 2,
  }

  const GRID_CONFIG = {
    "twelve-per-row": { count: 12, button: "twelvePerRowBtn" },
    "six-per-row": { count: 6, button: "sixPerRowBtn" },
    "three-per-row": { count: 3, button: "threePerRowBtn" },
    "one-per-row": { count: 1, button: "onePerRowBtn" },
  }

  // State
  const state = {
    imageUrls: [],
    currentIndex: -1,
    selectedImageCount: 3,
    zoomMode: ZOOM_MODES.DISABLED,
    lastScrollTop: 0,
  }

  // DOM Elements
  const elements = {
    imageContainer: document.getElementById("imageContainer"),
    buttonContainer: document.getElementById("buttonContainer"),
    scrollToTopBtn: document.getElementById("scrollToTopBtn"),
    fileInput: document.getElementById("fileInput"),
    clearAllBtn: document.getElementById("clearAll"),
    twelvePerRowBtn: document.getElementById("twelvePerRow"),
    sixPerRowBtn: document.getElementById("sixPerRow"),
    threePerRowBtn: document.getElementById("threePerRow"),
    onePerRowBtn: document.getElementById("onePerRow"),
    zoomInBtn: document.getElementById("zoomIn"),
    zoomOutBtn: document.getElementById("zoomOut"),
    zoomModeBtn: document.getElementById("zoomMode"),
    spotlightBtn: document.getElementById("spotlight"),
    fullScreenBtn: document.getElementById("fullScreen"),
    overlay: document.getElementById("overlay"),
    overlayImage: document.getElementById("overlayImage"),
    zoomLens: document.getElementById("zoomLens"),
  }

  // Utility Functions
  const createImage = (src, alt, onClick) => {
    const img = document.createElement("img")
    img.src = src
    img.alt = alt
    img.loading = "lazy"
    img.addEventListener("click", onClick)
    return img
  }

  const updateImageState = (imageUrl) => {
    state.imageUrls.push(imageUrl)
    if (state.currentIndex === -1) state.currentIndex = 0
  }

  // File Handling Functions
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files).sort((a, b) => a.name.localeCompare(b.name))

    for (const file of files) {
      if (file.type.startsWith("image/")) await handleImageFile(file)
      else if (file.type.startsWith("video/")) await handleVideoFile(file)
    }
  }

  const handleImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = createImage(e.target.result, file.name, () =>
          showImageInOverlay(e.target.result)
        )
        elements.imageContainer.appendChild(img)
        updateImageState(e.target.result)
        resolve()
      }
      reader.readAsDataURL(file)
    })
  }

  const generateTimestamps = (duration, count) => {
    if (count === 1) return [duration / 2]

    const interval = 1 / (count + 1)
    return Array.from({ length: count }, (_, i) => duration * ((i + 1) * interval))
  }

  const captureFrameAtTime = (video, time, index, fileName) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      video.currentTime = time
      video.addEventListener(
        "seeked",
        function onSeeked() {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          const img = createImage(
            canvas.toDataURL("image/png"),
            `${fileName} - Frame ${index + 1}`,
            () => showImageInOverlay(img.src)
          )
          elements.imageContainer.appendChild(img)
          updateImageState(img.src)

          video.removeEventListener("seeked", onSeeked)
          resolve()
        },
        { once: true }
      )
    })
  }

  const handleVideoFile = async (file) => {
    const video = document.createElement("video")
    video.src = URL.createObjectURL(file)
    video.preload = "metadata"

    await new Promise((resolve) =>
      video.addEventListener("loadedmetadata", resolve, { once: true })
    )
    const timestamps = generateTimestamps(video.duration, state.selectedImageCount)

    await Promise.all(
      timestamps.map((time, index) => captureFrameAtTime(video, time, index, file.name))
    )

    URL.revokeObjectURL(video.src)
    video.remove()
  }

  // Zoom Functions
  const zoomHandlers = {
    [ZOOM_MODES.DISABLED]: {
      activate: () => {
        elements.zoomModeBtn.style.outline = ""
        elements.zoomModeBtn.innerHTML = "<span>🔍</span>"
        elements.overlayImage.style.cursor = "default"
        deactivateZoom()
      },
    },
    [ZOOM_MODES.MAGNIFYING_GLASS]: {
      activate: () => {
        elements.zoomModeBtn.style.outline = "#f3c669 2px solid"
        elements.zoomModeBtn.innerHTML = "<span>🔍</span>"
        elements.overlayImage.style.cursor = "zoom-in"
        activateMagnifyingZoom()
      },
    },
    [ZOOM_MODES.ZOOM_LENS]: {
      activate: () => {
        elements.zoomModeBtn.style.outline = "#f3c669 2px solid"
        elements.zoomModeBtn.innerHTML = "<span>🔬</span>"
        elements.overlayImage.style.cursor = "crosshair"
        activateZoomLens()
      },
    },
  }

  const toggleZoomMode = () => {
    state.zoomMode = (state.zoomMode + 1) % 3
    zoomHandlers[state.zoomMode].activate()
  }

  const handleZoom = (event) => {
    const rect = elements.overlayImage.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const lensSize = 175
    const scale = 2

    const zoomLensStyles = {
      width: `${lensSize}px`,
      height: `${lensSize}px`,
      left: `${x - lensSize / 2}px`,
      top: `${y - lensSize / 2}px`,
      display: "block",
      backgroundImage: `url(${elements.overlayImage.src})`,
      backgroundSize: `${elements.overlayImage.width * scale}px ${
        elements.overlayImage.height * scale
      }px`,
      backgroundPosition: `-${x * scale - lensSize / 2}px -${y * scale - lensSize / 2}px`,
    }

    Object.assign(elements.zoomLens.style, zoomLensStyles)
  }

  // Event Handlers
  const handleImageContainerWidth = (event) => {
    const currentWidth = parseFloat(elements.imageContainer.style.maxWidth) || 90
    const widthChange = {
      "+": Math.min(currentWidth + 10, 100),
      "-": Math.max(currentWidth - 10, 10),
    }[event.key]

    if (widthChange !== undefined) {
      elements.imageContainer.style.maxWidth = `${widthChange}%`
    }
  }

  const toggleGrid = (className) => {
    const config = GRID_CONFIG[className]
    if (!config) return

    state.selectedImageCount = config.count
    elements.imageContainer.className = `image-container ${className}`

    // Remove the selectedGridOption class from all buttons
    const gridButtons = document.querySelectorAll("#buttonContainer button")
    gridButtons.forEach((button) => button.classList.remove("selectedGridOption"))
    
    // Add the selectedGridOption class to the clicked button
    elements[config.button].classList.add("selectedGridOption")
  }

  // Navigation Functions
  const navigateImages = (direction) => {
    if (state.imageUrls.length > 0) {
      state.currentIndex =
        (state.currentIndex + direction + state.imageUrls.length) % state.imageUrls.length
      showImageInOverlay(state.imageUrls[state.currentIndex])
    }
  }

  // Initialize Event Listeners
  const initializeEventListeners = () => {
    // File handling
    elements.fileInput.addEventListener("change", handleFileSelect)
    elements.clearAllBtn.addEventListener("click", () => {
      elements.imageContainer.innerHTML = ""
      state.imageUrls = []
      state.currentIndex = -1
    })

    // Grid controls
    Object.entries(GRID_CONFIG).forEach(([className, config]) => {
      elements[config.button].addEventListener("click", () => toggleGrid(className))
    })

    // Zoom controls
    elements.zoomInBtn.addEventListener("click", () => handleImageContainerWidth({ key: "+" }))
    elements.zoomOutBtn.addEventListener("click", () => handleImageContainerWidth({ key: "-" }))
    elements.zoomModeBtn.addEventListener("click", toggleZoomMode)

    // Navigation
    document.addEventListener("keydown", (e) => {
      const actions = {
        ArrowRight: () => navigateImages(1),
        ArrowLeft: () => navigateImages(-1),
        z: toggleZoomMode,
        f: () =>
          document[
            document.fullscreenElement ? "exitFullscreen" : "documentElement"
          ].requestFullscreen(),
        Escape: () => {
          elements.overlay.style.display = "none"
          elements.overlayImage.src = ""
          elements.zoomLens.style.display = "none"
          elements.overlayImage.style.transform = "none"
          deactivateZoom()
        },
      }
      if (actions[e.key]) actions[e.key]()
    })

    // Scroll handling
    window.addEventListener("scroll", () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      elements.scrollToTopBtn.style.display = scrollTop > state.lastScrollTop ? "none" : "block"
      state.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
    })

    elements.scrollToTopBtn.addEventListener("click", () => {
      document.body.scrollTop = 0
      document.documentElement.scrollTop = 0
    })
  }

  // Initialize the application
  initializeEventListeners()
})
