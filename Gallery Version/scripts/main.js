document.addEventListener("DOMContentLoaded", () => {
  // Define Element Variables
  const imageContainer = document.getElementById("imageContainer")
  const buttonContainer = document.getElementById("buttonContainer")
  const scrollToTopBtn = document.getElementById("scrollToTopBtn")

  const fileInput = document.getElementById("fileInput")
  const clearAllBtn = document.getElementById("clearAll")

  const twelvePerRowBtn = document.getElementById("twelvePerRow")
  const sixPerRowBtn = document.getElementById("sixPerRow")
  const threePerRowBtn = document.getElementById("threePerRow")
  const onePerRowBtn = document.getElementById("onePerRow")

  const zoomInBtn = document.getElementById("zoomIn")
  const zoomOutBtn = document.getElementById("zoomOut")
  const zoomModeBtn = document.getElementById("zoomMode")
  const spotlightBtn = document.getElementById("spotlight")
  const fullScreenBtn = document.getElementById("fullScreen")

  // Create overlay and image elements
  const overlay = document.createElement("div")
  const overlayImage = document.createElement("img")
  overlay.id = "overlay"
  overlayImage.id = "overlayImage"
  overlay.appendChild(overlayImage)
  document.body.appendChild(overlay)
  // Array to track image URLs and current index
  let imageUrls = []
  let currentIndex = -1

  // Initialize zoom lens
  const zoomLens = document.createElement("div")
  zoomLens.id = "zoomLens"
  overlay.appendChild(zoomLens)
  // States for zoom modes
  let zoomMode = 0 // 0: Deactivated, 1: Magnifying Glass Mode, 2: Zoom Lens Mode

  // ===================================================================
  // Add Click Event Listeners
  fileInput.addEventListener("change", handleFileSelect)
  clearAllBtn.addEventListener("click", () => {
    imageContainer.innerHTML = ""
    imageUrls = []
    currentIndex = -1
  })

  twelvePerRowBtn.addEventListener("click", () => toggleGrid("twelve-per-row"))
  sixPerRowBtn.addEventListener("click", () => toggleGrid("six-per-row"))
  threePerRowBtn.addEventListener("click", () => toggleGrid("three-per-row"))
  onePerRowBtn.addEventListener("click", () => toggleGrid("one-per-row"))

  zoomInBtn.addEventListener("click", () =>
    handleImageContainerWidth({ key: "+" })
  )
  zoomOutBtn.addEventListener("click", () =>
    handleImageContainerWidth({ key: "-" })
  )
  zoomModeBtn.addEventListener("click", toggleZoomMode)
  spotlightBtn.addEventListener("click", () => toggleSpotlight({ key: "h" }))
  fullScreenBtn.addEventListener("click", () => fullScreen({ key: "f" }))

  // Overlay click event listener
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) hideOverlay({ key: "Escape" })
  })
  // Prevent click event from bubbling up to overlay
  overlayImage.addEventListener("click", (event) => {
    event.stopPropagation()
  })

  // ===================================================================
  // Add Keyboard Event Listeners
  document.addEventListener("keydown", handleImageContainerWidth)
  document.addEventListener("keydown", (event) => {
    if (event.key === "z") toggleZoomMode() // Pressing 'z' acts like clicking zoomModeBtn
  })
  document.addEventListener("keydown", toggleSpotlight)
  document.addEventListener("keydown", fullScreen)
  document.addEventListener("keydown", hideOverlay)

  // Handle left and right arrow key navigation
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") showNextImage()
    else if (event.key === "ArrowLeft") showPreviousImage()
  })

  // Toggle zoom lens feature
  document.addEventListener("keydown", (event) => {
    if (event.key === "z") {
      isZoomLensEnabled = !isZoomLensEnabled
      if (isZoomLensEnabled) overlayImage.classList.add("zoomed")
      else overlayImage.classList.remove("zoomed")
    }
  })

  // ==================================================================
  // Add Scroll Event Listener
  let lastScrollTop = 0
  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    // Scrolling down
    if (scrollTop > lastScrollTop) scrollToTopBtn.style.display = "none"
    // Scrolling up
    else scrollToTopBtn.style.display = "block"

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop // For Mobile or negative scrolling
  })

  // When the user clicks on the button, scroll to the top of the document
  scrollToTopBtn.addEventListener("click", () => {
    document.body.scrollTop = 0 // For Safari
    document.documentElement.scrollTop = 0 // For Chrome, Firefox, IE and Opera
  })

  // ===================================================================
  async function handleFileSelect(event) {
    const files = Array.from(event.target.files)

    // Sort files by name to ensure they are processed in order
    files.sort((a, b) => a.name.localeCompare(b.name))

    // Process each file in sequence
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        await handleImageFile(file)
      } else if (file.type.startsWith("video/")) {
        await handleVideoFile(file)
      }
    }
  }

  function handleImageFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = function (e) {
        const img = document.createElement("img")
        img.src = e.target.result
        img.alt = file.name
        img.loading = "lazy"
        img.addEventListener("click", () => showImageInOverlay(e.target.result))
        imageContainer.appendChild(img)

        // Store image URL
        imageUrls.push(e.target.result)
        // Update currentIndex if this is the first image
        if (currentIndex === -1) currentIndex = 0

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

    const duration = video.duration
    const timestamps = [
      (duration * 1) / 8,
      (duration * 2) / 8,
      (duration * 3) / 8,
      (duration * 4) / 8,
      (duration * 5) / 8,
      (duration * 6) / 8,
    ]

    for (let i = 0; i < timestamps.length; i++) {
      await captureFrameAtTime(video, timestamps[i], i, file.name)
    }

    URL.revokeObjectURL(video.src) // Release memory
    video.remove()
  }

  function captureFrameAtTime(video, time, index, fileName) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      video.currentTime = time

      video.addEventListener(
        "seeked",
        function onSeeked() {
          // Set canvas dimensions to match the video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw the video frame on the canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Create an image from the canvas
          const img = document.createElement("img")
          img.src = canvas.toDataURL("image/png")
          img.alt = `${fileName} - Frame ${index + 1}`
          img.loading = "lazy"
          img.addEventListener("click", () => showImageInOverlay(img.src))
          imageContainer.appendChild(img)

          // Store image URL
          imageUrls.push(img.src)

          // Update currentIndex if this is the first image
          if (currentIndex === -1) {
            currentIndex = 0
          }

          // Remove the event listener and resolve the promise
          video.removeEventListener("seeked", onSeeked)
          resolve()
        },
        { once: true }
      )
    })
  }

  // ===================================================================
  function toggleGrid(className) {
    // Update the grid class
    imageContainer.className = `image-container ${className}`

    // Determine clicked button
    let selectedButton
    switch (className) {
      case "twelve-per-row":
        selectedButton = twelvePerRowBtn
        break
      case "six-per-row":
        selectedButton = sixPerRowBtn
        break
      case "three-per-row":
        selectedButton = threePerRowBtn
        break
      default:
        selectedButton = onePerRowBtn
    }

    // Remove the selectedGridOption class from all buttons
    const gridButtons = document.querySelectorAll("#buttonContainer button")
    gridButtons.forEach((button) =>
      button.classList.remove("selectedGridOption")
    )

    // Add the selectedGridOption class to the clicked button
    selectedButton.classList.add("selectedGridOption")
  }

  function handleImageContainerWidth(event) {
    const currentWidth = parseFloat(imageContainer.style.maxWidth) || 90
    if (
      event.key === "=" ||
      event.key === "+" ||
      (event.key === "=" && event.shiftKey)
    ) {
      imageContainer.style.maxWidth = `${Math.min(currentWidth + 10, 100)}%`
    } else if (event.key === "-") {
      imageContainer.style.maxWidth = `${Math.max(currentWidth - 10, 10)}%`
    }
  }

  function toggleSpotlight(event) {
    if (event.key === "h") {
      const body = document.body

      if (buttonContainer.style.display === "none") {
        buttonContainer.style.display = "flex"
        body.style.overflow = "auto"
      } else {
        buttonContainer.style.display = "none"
        body.style.overflow = "hidden"
      }
    }
  }

  function fullScreen(event) {
    if (event.key === "f") {
      if (document.fullscreenElement) document.exitFullscreen()
      else document.documentElement.requestFullscreen()
    }
  }

  // ===================================================================
  function showImageInOverlay(src) {
    overlayImage.src = src
    overlay.style.display = "flex"

    // Set the correct cursor and zoom mode based on the current zoom state
    switch (zoomMode) {
      case 0: // Deactivated
        overlayImage.style.cursor = "default"
        deactivateZoom()
        break
      case 1: // Magnifying Glass Mode
        overlayImage.style.cursor = "zoom-in"
        activateMagnifyingZoom() // Initialize click-to-zoom mode
        break
      case 2: // Zoom Lens Mode
        overlayImage.style.cursor = "crosshair"
        activateZoomLens() // Initialize zoom lens mode
        break
    }

    // Hide the zoom lens initially
    zoomLens.style.display = "none"
  }

  function hideOverlay(event) {
    if (event.key === "Escape") {
      overlay.style.display = "none"
      overlayImage.src = "" // Clear the image source
      zoomLens.style.display = "none" // Hide the zoom lens
      overlayImage.style.transform = "none" // Reset the zoom effect

      // Remove zoom-related event listeners
      deactivateZoom() // This function now handles removing all zoom listeners
    }
  }

  // ===================================================================
  function showNextImage() {
    if (imageUrls.length > 0) {
      currentIndex = (currentIndex + 1) % imageUrls.length
      showImageInOverlay(imageUrls[currentIndex])
    }
  }

  function showPreviousImage() {
    if (imageUrls.length > 0) {
      currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length
      showImageInOverlay(imageUrls[currentIndex])
    }
  }

  // ===================================================================
  // Toggle Zoom Mode function
  function toggleZoomMode() {
    zoomMode = (zoomMode + 1) % 3 // Cycle through 0, 1, 2

    switch (zoomMode) {
      case 0: // Deactivated
        zoomModeBtn.style.outline = "" // Remove outline
        zoomModeBtn.innerHTML = "<span>🔍</span>" // Reset to magnifying glass icon
        overlayImage.style.cursor = "default" // Normal cursor
        deactivateZoom() // Deactivate zoom behavior
        break

      case 1: // Magnifying Glass Mode
        zoomModeBtn.style.outline = "#f3c669 2px solid" // Add outline
        zoomModeBtn.innerHTML = "<span>🔍</span>" // Keep magnifying icon
        overlayImage.style.cursor = "zoom-in" // Set cursor to zoom-in
        activateMagnifyingZoom() // Activate magnifying zoom behavior
        break

      case 2: // Zoom Lens Mode
        zoomModeBtn.style.outline = "#f3c669 2px solid" // Keep outline
        zoomModeBtn.innerHTML = "<span>🔬</span>" // Change to microscope lens icon
        overlayImage.style.cursor = "crosshair" // Set cursor to zoom lens
        activateZoomLens() // Activate zoom lens behavior
        break
    }
  }

  // ===================================================================
  // Activate Magnifying Glass Mode
  function activateMagnifyingZoom() {
    overlayImage.addEventListener("click", handleZoomClick) // Zoom on click
    overlayImage.removeEventListener("mousemove", zoom) // Disable zoom lens movement
    zoomLens.style.display = "none" // Ensure lens is hidden
  }

  // Deactivate zoom behavior
  function deactivateZoom() {
    // Remove all zoom-related event listeners
    overlayImage.removeEventListener("click", handleZoomClick) // For magnifying glass mode
    overlayImage.removeEventListener("mousemove", zoom) // For zoom lens mode
    overlayImage.removeEventListener("mouseenter", showLens) // For zoom lens mode
    overlayImage.removeEventListener("mouseleave", hideLens) // For zoom lens mode

    zoomLens.style.display = "none" // Hide the zoom lens
    overlayImage.style.transform = "none" // Reset zoom scale
  }

  // Activate Zoom Lens Mode
  function activateZoomLens() {
    overlayImage.removeEventListener("click", handleZoomClick) // Disable magnifying zoom
    overlayImage.addEventListener("mousemove", zoom) // Enable zoom lens movement
    overlayImage.addEventListener("mouseenter", showLens) // Show lens on hover
    overlayImage.addEventListener("mouseleave", hideLens) // Hide lens on exit
  }

  // Handle zoom on click for magnifying glass mode
  function handleZoomClick(event) {
    if (overlayImage.style.cursor === "zoom-in") zoomInImage(event)
    else zoomOutImage()

    // Toggle between zoom-in and zoom-out cursor
    overlayImage.style.cursor =
      overlayImage.style.cursor === "zoom-in" ? "zoom-out" : "zoom-in"
  }

  // ===================================================================
  // Zoom lens functions
  function zoom(event) {
    const rect = overlayImage.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const lensSize = 175 // Size of the zoom lens
    const scale = 2 // Zoom scale

    // Position the zoom lens
    zoomLens.style.width = `${lensSize}px`
    zoomLens.style.height = `${lensSize}px`
    zoomLens.style.left = `${x - lensSize / 2}px`
    zoomLens.style.top = `${y - lensSize / 2}px`
    zoomLens.style.display = "block"

    // Adjust the background position of the zoom lens to zoom in
    zoomLens.style.backgroundImage = `url(${overlayImage.src})`
    zoomLens.style.backgroundSize = `${overlayImage.width * scale}px ${
      overlayImage.height * scale
    }px`
    zoomLens.style.backgroundPosition = `-${x * scale - lensSize / 2}px -${
      y * scale - lensSize / 2
    }px`
  }

  function showLens() {
    zoomLens.style.display = "block"
  }

  function hideLens() {
    zoomLens.style.display = "none"
  }

  function zoomInImage(event) {
    const rect = overlayImage.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Calculate the zoom scale and apply transformation
    const scale = 2 // Adjust as needed
    overlayImage.style.transformOrigin = `${x}px ${y}px`
    overlayImage.style.transform = `scale(${scale})`
  }

  function zoomOutImage() {
    // Reset transform to default
    overlayImage.style.transform = "none"
    overlayImage.style.transformOrigin = "center center"
  }
})
