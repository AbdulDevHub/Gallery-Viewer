document.addEventListener("DOMContentLoaded", () => {
  // Define Element Variables
  const container = document.querySelector(".container")
  const imageContainer = document.getElementById("imageContainer")
  const buttonContainer = document.getElementById("buttonContainer")

  const fileInput = document.getElementById("fileInput")
  const clearAllButton = document.getElementById("clearAll")

  const twelvePerRowButton = document.getElementById("twelvePerRow")
  const sixPerRowButton = document.getElementById("sixPerRow")
  const threePerRowButton = document.getElementById("threePerRow")
  const onePerRowButton = document.getElementById("onePerRow")

  // Add Click Event Listeners
  fileInput.addEventListener("change", handleFileSelect)
  clearAllButton.addEventListener(
    "click",
    () => (imageContainer.innerHTML = "")
  )
  twelvePerRowButton.addEventListener("click", () =>
    toggleGrid("twelve-per-row")
  )
  sixPerRowButton.addEventListener("click", () => toggleGrid("six-per-row"))
  threePerRowButton.addEventListener("click", () => toggleGrid("three-per-row"))
  onePerRowButton.addEventListener("click", () => toggleGrid("one-per-row"))

  // Add Keyboard Event Listeners
  document.addEventListener("keydown", handleContainerWidth)
  document.addEventListener("keydown", toggleSpotlight)
  document.addEventListener("keydown", fullScreen)

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

    // Create a container for this video's frames
    const videoFrameContainer = document.createElement("div")
    videoFrameContainer.className = "video-frame-container"
    imageContainer.appendChild(videoFrameContainer)

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
      await captureFrameAtTime(
        video,
        timestamps[i],
        i,
        videoFrameContainer,
        file.name
      )
    }

    URL.revokeObjectURL(video.src) // Release memory
    video.remove()
  }

  function captureFrameAtTime(video, time, index, container, fileName) {
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
          container.appendChild(img)

          // Remove the event listener and resolve the promise
          video.removeEventListener("seeked", onSeeked)
          resolve()
        },
        { once: true }
      )
    })
  }

  function toggleGrid(className) {
    imageContainer.className = `image-container ${className}`
  }

  function handleContainerWidth(event) {
    const currentWidth = parseFloat(container.style.maxWidth) || 90
    if (
      event.key === "=" ||
      event.key === "+" ||
      (event.key === "=" && event.shiftKey)
    ) {
      container.style.maxWidth = `${Math.min(currentWidth + 10, 100)}%`
    } else if (event.key === "-") {
      container.style.maxWidth = `${Math.max(currentWidth - 10, 10)}%`
    }
  }

  function toggleSpotlight(event) {
    if (event.key === "h") {
      const body = document.body

      if (buttonContainer.style.display === "none") {
        buttonContainer.style.display = "block"
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
})
