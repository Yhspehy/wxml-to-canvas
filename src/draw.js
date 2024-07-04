class Draw {
  constructor(context, canvas, use2dCanvas = false) {
    this.ctx = context
    this.canvas = canvas || null
    this.use2dCanvas = use2dCanvas
  }

  roundRect(x, y, w, h, r, fill = true, stroke = false) {
    if (r < 0) return
    const ctx = this.ctx

    ctx.beginPath()
    ctx.arc(x + r, y + r, r, Math.PI, (Math.PI * 3) / 2)
    ctx.arc(x + w - r, y + r, r, (Math.PI * 3) / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
    ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
    ctx.lineTo(x, y + r)
    if (stroke) ctx.stroke()
    if (fill) ctx.fill()
  }

  drawView(box, style) {
    const ctx = this.ctx
    const { left: x, top: y, width: w, height: h } = box
    const {
      borderRadius = 0,
      borderWidth = 0,
      borderColor,
      color = '#000',
      backgroundColor = 'transparent',
      shadow
    } = style
    ctx.save()

    // 阴影shadow
    if (shadow) {
      this.drawShadow(shadow)
    }

    // 外环
    if (borderWidth > 0) {
      ctx.fillStyle = borderColor || color
      this.roundRect(x, y, w, h, borderRadius)
      // 取消内环的阴影
      ctx.shadowOffsetX = ''
      ctx.shadowOffsetY = ''
      ctx.shadowBlur = ''
      ctx.shadowColor = ''
    }

    // 内环
    ctx.fillStyle = backgroundColor
    const innerWidth = w - 2 * borderWidth
    const innerHeight = h - 2 * borderWidth
    const innerRadius =
      borderRadius - borderWidth >= 0 ? borderRadius - borderWidth : 0

    this.roundRect(
      x + borderWidth,
      y + borderWidth,
      innerWidth,
      innerHeight,
      innerRadius
    )
    ctx.restore()
  }

  async drawImage(img, box, style, mode, clip) {
    await new Promise((resolve, reject) => {
      const ctx = this.ctx
      const canvas = this.canvas

      const { borderRadius = 0, shadow } = style
      const { left: x, top: y, width: w, height: h } = box
      ctx.save()

      if (clip !== false) {
        this.roundRect(x, y, w, h, borderRadius, false, false)
        ctx.clip()
      }

      const _drawImage = img => {
        // 阴影shadow
        if (shadow) {
          this.drawShadow(shadow)
        }
        if (this.use2dCanvas) {
          const Image = canvas.createImage()
          Image.onload = () => {
            if (mode) {
              wx.getImageInfo({
                src: img,
                success: imgInfo => {
                  const { width: iW, height: iH } = imgInfo
                  if (mode === 'aspectFit') {
                    if (w / h >= iW / iH) {
                      let dWidth = (h / iH) * iW
                      let dx = (w - dWidth) / 2 + x
                      ctx.drawImage(Image, dx, y, dWidth, h)
                    } else {
                      let dHeight = (w / iW) * iH
                      let dy = (h - dHeight) / 2 + y
                      ctx.drawImage(Image, x, dy, w, dHeight)
                    }
                  } else if (mode === 'aspectFill') {
                    if (w / h >= iW / iH) {
                      let dx = 0,
                        dy,
                        dWidth,
                        dHeight
                      dWidth = iW
                      dHeight = iW / (w / h)
                      dy = (iH - dHeight) / 2
                      ctx.drawImage(Image, dx, dy, dWidth, dHeight, x, y, w, h)
                      ctx.restore()
                      resolve()
                    } else {
                      let dx,
                        dy = 0,
                        dWidth,
                        dHeight
                      dHeight = iH
                      dWidth = iH / (h / w)
                      dx = (iW - dWidth) / 2
                      ctx.drawImage(Image, dx, dy, dWidth, dHeight, x, y, w, h)
                      ctx.restore()
                      resolve()
                    }
                  } else {
                    reject(
                      new Error(
                        `image mode error: ${mode},  only support 'aspectFit' and  'aspectFill'`
                      )
                    )
                  }
                }
              })
            } else {
              ctx.drawImage(Image, x, y, w, h)
              ctx.restore()
              resolve()
            }
          }
          Image.onerror = () => {
            reject(new Error(`createImage fail: ${img}`))
          }
          Image.src = img
        } else {
          ctx.drawImage(img, x, y, w, h)
          ctx.restore()
          resolve()
        }
      }

      const isTempFile = /^wxfile:\/\//.test(img)
      const isNetworkFile = /^https?:\/\//.test(img)
      const isSvg = /.*\.svg$/.test(img)

      if (isTempFile) {
        _drawImage(img)
      } else if (isSvg) {
        reject(new Error(`svg is not support: ${img}`))
      } else if (isNetworkFile) {
        wx.downloadFile({
          url: img,
          success(res) {
            if (res.statusCode === 200) {
              _drawImage(res.tempFilePath)
            } else {
              reject(new Error(`downloadFile:fail ${img}`))
            }
          },
          fail() {
            reject(new Error(`downloadFile:fail ${img}`))
          }
        })
      } else {
        reject(new Error(`image format error: ${img}`))
      }
    })
  }

  // eslint-disable-next-line complexity
  drawText(text, box, style) {
    const ctx = this.ctx
    let { left: x, top: y, width: w, height: h } = box
    let {
      color = '#000',
      lineHeight = '1.4em',
      fontSize = 14,
      textAlign = 'left',
      verticalAlign = 'top',
      backgroundColor = 'transparent',
      shadow
    } = style

    if (typeof lineHeight === 'string') {
      // 2em
      lineHeight = Math.ceil(parseFloat(lineHeight.replace('em')) * fontSize)
    }
    if (!text || lineHeight > h) return

    ctx.save()
    ctx.textBaseline = 'top'
    ctx.font = `${fontSize}px sans-serif`
    ctx.textAlign = textAlign

    // 阴影shadow
    if (shadow) {
      this.drawShadow(shadow)
    }

    // 背景色
    ctx.fillStyle = backgroundColor
    this.roundRect(x, y, w, h, 0)

    // 文字颜色
    ctx.fillStyle = color

    // 水平布局
    switch (textAlign) {
      case 'left':
        break
      case 'center':
        x += 0.5 * w
        break
      case 'right':
        x += w
        break
      default:
        break
    }

    const textWidth = ctx.measureText(text).width
    const actualHeight = Math.ceil(textWidth / w) * lineHeight
    let paddingTop = Math.ceil((h - actualHeight) / 2)
    if (paddingTop < 0) paddingTop = 0

    // 垂直布局
    switch (verticalAlign) {
      case 'top':
        break
      case 'middle':
        y += paddingTop
        break
      case 'bottom':
        y += 2 * paddingTop
        break
      default:
        break
    }

    const inlinePaddingTop = Math.ceil((lineHeight - fontSize) / 2)

    // 不超过一行
    if (textWidth <= w) {
      ctx.fillText(text, x, y + inlinePaddingTop)
      return
    }

    // 多行文本
    function groupStrings(inputString) {
      const groups = [];
      let currentGroup = '';
      const isChineseChar = (char) => char.match(/[\u4e00-\u9fa5]/); // 判断是否是中文字符
    
      for (let i = 0; i < inputString.length; i++) {
        const char = inputString[i];
    
        if (isChineseChar(char)) {
          // 对于中文字符，将当前非空的非中文字符组加入结果，并重置 currentGroup
          if (currentGroup !== '') {
            groups.push(currentGroup);
          }
          groups.push(char);
          currentGroup = '';
        } else if (/[a-zA-Z']/.test(char)) {
          // 对于英文字符和单引号，将其添加到当前组
          currentGroup += char;
        } else if (/\s/.test(char)) {
          // 对于空格，将当前非空的非中文字符组加入结果，并重置 currentGroup，然后添加空格
          if (currentGroup !== '') {
            groups.push(currentGroup);
          }
          currentGroup = '';
          groups.push(char);
        }
    }
    
      // 处理最后一个非中文字符组
      if (currentGroup !== '') {
        groups.push(currentGroup);
      }
    
      return groups;
    }

    // 多行文本
    const chars = groupStrings(text);
    const _y = y

    // 逐行绘制
    let line = ''
    for (const ch of chars) {
      const testLine = line + ch
      const testWidth = ctx.measureText(testLine).width

      if (testWidth > w) {
        // 换行之后是否超过文本的高度
        if (y + lineHeight * 2 > _y + h) {
          // 不截断省略号
          while (ctx.measureText(line + '...').width > w) {
            line = line.slice(0, -1)
          }
          ctx.fillText(line + '...', x, y + inlinePaddingTop)
          break
        } else {
          ctx.fillText(line, x, y + inlinePaddingTop)
          y += lineHeight
          line = ch
        }
      } else {
        line = testLine
      }
    }

    // 避免溢出
    if (y + lineHeight <= _y + h) {
      ctx.fillText(line, x, y + inlinePaddingTop)
    }

    ctx.restore()
  }

  drawShadow(shadow) {
    const ctx = this.ctx
    let shadowVList = shadow.replace(/,\s+/g, ',').split(/\s+/)
    if (shadowVList.length > 4) {
      console.error("shadow don't spread option")
      return
    }
    ctx.shadowOffsetX = parseInt(shadowVList[0], 10)
    ctx.shadowOffsetY = parseInt(shadowVList[1], 10)
    ctx.shadowBlur = parseInt(shadowVList[2], 10)
    ctx.shadowColor = shadowVList[3]
  }

  async drawNode(element) {
    const { layoutBox, computedStyle, name } = element
    const { src, text, mode, clip } = element.attributes
    if (name === 'view') {
      this.drawView(layoutBox, computedStyle)
    } else if (name === 'image') {
      await this.drawImage(src, layoutBox, computedStyle, mode, clip)
    } else if (name === 'text') {
      this.drawText(text, layoutBox, computedStyle)
    }
    const childs = Object.values(element.children)
    for (const child of childs) {
      await this.drawNode(child)
    }
  }
}

module.exports = {
  Draw
}
