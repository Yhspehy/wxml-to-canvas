# CHANGELOG

## 1.0.8

### Fixes

- 修复英文单词换行折断问题

## 1.0.7

### Feats

- 新增 text，image，view 的 shadow css 属性，当在 image 上使用时，需要传递 clip 属性为 false，否则会裁剪图片
- 新增 ellipsis, shadow, list 的 demo

### Fixes

- 初始化画布时，宽高不生效的 bug

## 1.0.6

### Fixes

- ctx.restore() after drawImage with mode

## 1.0.5

### Feats

- image 支持 mode(aspectFit, aspectFill)

## 1.0.4

### Feats

- 支持在 onLoad 中即时渲染画布
- 支持传入动态宽高
- 新增 warning，暂不支持 svg

## 1.0.3

### Feats

- 更新 gulpfile,eslint,prettier 文件

## 1.0.2

### Feats

- 更新文档

## 1.0.1

### Feats

- 新增 androidDprTo2 属性,部分安卓机导出图片过大
- 画文本的时候，会自动计算宽度，超出部分转换成...（支持单行和多行）
