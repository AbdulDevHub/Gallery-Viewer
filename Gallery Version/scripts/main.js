document.addEventListener("DOMContentLoaded", () => {
  // Define Element Variables
  const imageContainer = document.getElementById("imageContainer")
  const buttonContainer = document.getElementById("buttonContainer")

  const fileInput = document.getElementById("fileInput")
  const clearAllBtn = document.getElementById("clearAll")

  const twelvePerRowBtn = document.getElementById("twelvePerRow")
  const sixPerRowBtn = document.getElementById("sixPerRow")
  const threePerRowBtn = document.getElementById("threePerRow")
  const onePerRowBtn = document.getElementById("onePerRow")

  const zoomInBtn = document.getElementById("zoomIn")
  const zoomOutBtn = document.getElementById("zoomOut")
  const spotlightBtn = document.getElementById("spotlight")
  const fullScreenBtn = document.getElementById("fullScreen")

  // Create overlay and image elements
  const overlay = document.createElement("div")
  const overlayImage = document.createElement("img")
  overlay.id = "overlay"
  overlayImage.id = "overlayImage"
  overlay.appendChild(overlayImage)
  document.body.appendChild(overlay)

  // Initialize zoom lens
  const zoomLens = document.createElement("div")
  zoomLens.id = "zoomLens"
  overlay.appendChild(zoomLens)

  // ===================================================================
  // Add Click Event Listeners
  fileInput.addEventListener("change", handleFileSelect)
  clearAllBtn.addEventListener("click", () => (imageContainer.innerHTML = ""))

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
  spotlightBtn.addEventListener("click", () => toggleSpotlight({ key: "h" }))
  fullScreenBtn.addEventListener("click", () => fullScreen({ key: "f" }))

  // Overlay click event listener
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      hideOverlay()
    }
  })

  // Add Keyboard Event Listeners
  document.addEventListener("keydown", handleImageContainerWidth)
  document.addEventListener("keydown", toggleSpotlight)
  document.addEventListener("keydown", fullScreen)

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
        img.addEventListener("click", () => showImageInOverlay(e.target.result))
        imageContainer.appendChild(img)
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
          img.addEventListener("click", () => showImageInOverlay(img.src))
          imageContainer.appendChild(img)

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

    // Prevent click event from bubbling up to overlay
    overlayImage.addEventListener("click", (event) => {
      event.stopPropagation()
    })

    // Add zoom functionality
    overlayImage.addEventListener("mousemove", zoom)
    overlayImage.addEventListener("mouseenter", showLens)
    overlayImage.addEventListener("mouseleave", hideLens)
    overlay.addEventListener("click", hideOverlay)
  }

  function zoom(event) {
    const rect = overlayImage.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const lensSize = 100 // Size of the zoom lens
    const scale = 2; // Zoom scale

    // Position the zoom lens
    zoomLens.style.width = `${lensSize}px`
    zoomLens.style.height = `${lensSize}px`
    zoomLens.style.left = `${x - lensSize / 2}px`
    zoomLens.style.top = `${y - lensSize / 2}px`
    zoomLens.style.display = "block"

    // Adjust the background position of the zoom lens to zoom in
    zoomLens.style.width = `${lensSize}px`;
    zoomLens.style.height = `${lensSize}px`;
    zoomLens.style.left = `${x - lensSize / 2}px`;
    zoomLens.style.top = `${y - lensSize / 2}px`;
    zoomLens.style.display = "block";
    zoomLens.style.backgroundImage = `url(${overlayImage.src})`;
    zoomLens.style.backgroundSize = `${overlayImage.width * scale}px ${overlayImage.height * scale}px`;
    zoomLens.style.backgroundPosition = `-${x * scale - lensSize / 2}px -${y * scale - lensSize / 2}px`;
  }

  function showLens() {
    zoomLens.style.display = "block"
    overlayImage.classList.add("zoomed")
  }

  function hideLens() {
    zoomLens.style.display = "none"
    overlayImage.classList.remove("zoomed")
  }

  function hideOverlay() {
    overlay.style.display = "none";
    overlayImage.src = ""; // Clear the image source
    zoomLens.style.display = "none"; // Hide the zoom lens
  }
})
