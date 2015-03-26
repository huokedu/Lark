//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-2015, Egret Technology Inc.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

module lark {
    /**
     * 显示对象基类
     */
    export class DisplayObject extends EventDispatcher {
        /**
         * 创建一个显示对象
         */
        public constructor() {
            super();
            this._displayObjectFlags = DisplayObjectFlags.Visible |
            DisplayObjectFlags.InvalidConcatenatedMatrix |
            DisplayObjectFlags.InvalidInvertedConcatenatedMatrix |
            DisplayObjectFlags.InvalidConcatenatedAlpha |
            DisplayObjectFlags.Dirty;
        }

        /**
         * 格式化旋转角度的值
         */
        private static clampRotation(value):number {
            value %= 360;
            if (value > 180) {
                value -= 360;
            } else if (value < -180) {
                value += 360;
            }
            return value;
        }

        private _displayObjectFlags:number = 0;

        $setFlags(flags:DisplayObjectFlags):void {
            this._displayObjectFlags |= flags;
        }

        $toggleFlags(flags:DisplayObjectFlags, on:boolean):void {
            if (on) {
                this._displayObjectFlags |= flags;
            } else {
                this._displayObjectFlags &= ~flags;
            }
        }

        $removeFlags(flags:DisplayObjectFlags):void {
            this._displayObjectFlags &= ~flags;
        }

        /**
         * 沿着显示列表向上移除标志量，如果标志量没被设置过就停止移除。
         */
        $removeFlagsUp(flags:DisplayObjectFlags):void {
            if (!this.$hasFlags(flags)) {
                return;
            }
            this.$removeFlags(flags)
            var parent = this.$parent;
            if (parent) {
                parent.$removeFlagsUp(flags);
            }
        }

        $hasFlags(flags:DisplayObjectFlags):boolean {
            return (this._displayObjectFlags & flags) === flags;
        }

        /**
         * 沿着显示列表向上传递标志量，如果标志量已经被设置过就停止传递。
         */
        $propagateFlagsUp(flags:DisplayObjectFlags):void {
            if (this.$hasFlags(flags)) {
                return;
            }
            this.$setFlags(flags);
            var parent = this.$parent;
            if (parent) {
                parent.$propagateFlagsUp(flags);
            }
        }

        /**
         * 沿着显示列表向下传递标志量，非容器直接设置自身的flag，此方法会在DisplayObjectContainer中被覆盖。
         */
        $propagateFlagsDown(flags:DisplayObjectFlags):void {
            this.$setFlags(flags);
        }

        $hasAnyFlags(flags:DisplayObjectFlags):boolean {
            return !!(this._displayObjectFlags & flags);
        }

        $invalidateMatrix():void {
            this.$markDirty();
            this.$setFlags(DisplayObjectFlags.InvalidMatrix);
            this.$invalidatePosition();
        }

        /**
         * 标记这个显示对象在父级容器的位置发生了改变。
         */
        $invalidatePosition():void {
            this.$markDirty();
            this.$propagateFlagsDown(DisplayObjectFlags.InvalidConcatenatedMatrix |
            DisplayObjectFlags.InvalidInvertedConcatenatedMatrix);
            if (this.$parent) {
                this.$parent.$propagateFlagsUp(DisplayObjectFlags.InvalidContentBounds);
            }
        }

        /**
         * 能够含有子项的类将子项列表存储在这个属性里。
         */
        $children:DisplayObject[] = null;

        /**
         * 表示 DisplayObject 的实例名称。
         * 通过调用父显示对象容器的 getChildByName() 方法，可以在父显示对象容器的子列表中标识该对象。
         */
        public name:string;

        $parent:DisplayObjectContainer;

        /**
         * 表示包含此显示对象的 DisplayObjectContainer 对象。
         * 使用 parent 属性可以指定高于显示列表层次结构中当前显示对象的显示对象的相对路径。
         */
        public get parent():DisplayObjectContainer {
            return this.$parent;
        }

        $setParent(parent:DisplayObjectContainer):void {
            this.$parent = parent;
        }

        $onAddToStage(stage:Stage):void {
            this.$stage = stage;
            DisplayObjectContainer.$EVENT_ADD_TO_STAGE_LIST.push(this);
            var node = this.$renderNode;
            if (node) {
                stage.$dirtyRenderNodes[node.hashCode] = node;
            }
        }

        $onRemoveFromStage():void {
            DisplayObjectContainer.$EVENT_REMOVE_FROM_STAGE_LIST.push(this);
            var node = this.$renderNode;
            if (node) {
                this.$stage.$dirtyRenderNodes[node.hashCode] = node;
            }
        }

        $stage:Stage = null;

        /**
         * 显示对象的舞台。
         * 例如，您可以创建多个显示对象并加载到显示列表中，每个显示对象的 stage 属性是指相同的 Stage 对象。
         * 如果显示对象未添加到显示列表，则其 stage 属性会设置为 null。
         */
        public get stage():Stage {
            return this.$stage;
        }

        private _matrix:Matrix = new Matrix();
        /**
         * 一个 Matrix 对象，其中包含更改显示对象的缩放、旋转和平移的值。
         */
        public get matrix():Matrix {
            return this.$getMatrix();
        }

        $getMatrix():Matrix {
            if (this.$hasFlags(DisplayObjectFlags.InvalidMatrix)) {
                this._matrix.$updateScaleAndRotation(this._scaleX, this._scaleY, this._skewX, this._skewY);
                this.$removeFlags(DisplayObjectFlags.InvalidMatrix);
            }
            return this._matrix;
        }

        public set matrix(value:Matrix) {
            this.$setMatrix(value);
            if (value) {
                this._matrix.copyFrom(value);
            }
        }

        $setMatrix(matrix:Matrix):void {
            if (this._matrix.equals(matrix)) {
                return;
            }
            var m = this._matrix;
            m.copyFrom(matrix);
            this._scaleX = m.$getScaleX();
            this._scaleY = m.$getScaleY();
            this._skewX = matrix.$getSkewX();
            this._skewY = matrix.$getSkewY();
            this._rotation = DisplayObject.clampRotation(this._skewY * 180 / Math.PI);
            this.$removeFlags(DisplayObjectFlags.InvalidMatrix);
            this.$invalidatePosition();
        }

        private _concatenatedMatrix:Matrix = new Matrix();

        /**
         * 获得这个显示对象以及它所有父级对象的连接矩阵。
         */
        $getConcatenatedMatrix():Matrix {
            if (this.$hasFlags(DisplayObjectFlags.InvalidConcatenatedMatrix)) {
                if (this.$parent) {
                    this.$parent.$getConcatenatedMatrix().$preMultiplyInto(this.$getMatrix(),
                        this._concatenatedMatrix);
                } else {
                    this._concatenatedMatrix.copyFrom(this.$getMatrix());
                }
                if (this.$renderNode) {
                    this.$renderNode.moved = true;
                }
                this.$removeFlags(DisplayObjectFlags.InvalidConcatenatedMatrix);
            }
            return this._concatenatedMatrix;
        }

        private _invertedConcatenatedMatrix:Matrix = new Matrix();

        $getInvertedConcatenatedMatrix():Matrix {
            if (this.$hasFlags(DisplayObjectFlags.InvalidInvertedConcatenatedMatrix)) {
                this.$getConcatenatedMatrix().$invertInto(this._invertedConcatenatedMatrix);
                this.$removeFlags(DisplayObjectFlags.InvalidInvertedConcatenatedMatrix);
            }
            return this._invertedConcatenatedMatrix;
        }

        /**
         * 表示 DisplayObject 实例相对于父级 DisplayObjectContainer 本地坐标的 x 坐标。
         * 如果该对象位于具有变形的 DisplayObjectContainer 内，则它也位于包含 DisplayObjectContainer 的本地坐标系中。
         * 因此，对于逆时针旋转 90 度的 DisplayObjectContainer，该 DisplayObjectContainer 的子级将继承逆时针旋转 90 度的坐标系。
         */
        public get x():number {
            return this._matrix.tx;
        }

        public set x(value:number) {
            value = +value || 0;
            if (value === this._matrix.tx) {
                return;
            }
            this._matrix.tx = value;
            this.$invalidatePosition();
        }

        /**
         * 表示 DisplayObject 实例相对于父级 DisplayObjectContainer 本地坐标的 y 坐标。
         * 如果该对象位于具有变形的 DisplayObjectContainer 内，则它也位于包含 DisplayObjectContainer 的本地坐标系中。
         * 因此，对于逆时针旋转 90 度的 DisplayObjectContainer，该 DisplayObjectContainer 的子级将继承逆时针旋转 90 度的坐标系。
         */
        public get y():number {
            return this._matrix.ty;
        }

        public set y(value:number) {
            value = +value || 0;
            if (value === this._matrix.ty) {
                return;
            }
            this._matrix.ty = value;
            this.$invalidatePosition();
        }


        private _scaleX:number = 1;
        /**
         * 表示从注册点开始应用的对象的水平缩放比例（百分比）。
         * 缩放本地坐标系统将更改 x 和 y 属性值，这些属性值是以整像素定义的。
         * 默认值为 1，即不缩放。
         * @default 1
         */
        public get scaleX():number {
            return this._scaleX;
        }

        public set scaleX(value:number) {
            value = +value || 0;
            if (value === this._scaleX) {
                return;
            }
            this._scaleX = value;
            this.$invalidateMatrix();
        }

        private _scaleY:number = 1;
        /**
         * 表示从对象注册点开始应用的对象的垂直缩放比例（百分比）。
         * 缩放本地坐标系统将更改 x 和 y 属性值，这些属性值是以整像素定义的。
         * 默认值为 1，即不缩放。
         * @default 1
         */
        public get scaleY():number {
            return this._scaleY;
        }

        public set scaleY(value:number) {
            value = +value || 0;
            if (value === this._scaleY) {
                return;
            }
            this._scaleY = value;
            this.$invalidateMatrix();
        }

        private _skewX:number = 0;
        private _skewY:number = 0;
        private _rotation:number = 0;
        /**
         * 表示 DisplayObject 实例距其原始方向的旋转程度，以度为单位。
         * 从 0 到 180 的值表示顺时针方向旋转；从 0 到 -180 的值表示逆时针方向旋转。对于此范围之外的值，可以通过加上或
         * 减去 360 获得该范围内的值。例如，my_video.rotation = 450语句与 my_video.rotation = 90 是相同的。
         * @default 0 默认值为 0 不旋转。
         */
        public get rotation():number {
            return this._rotation;
        }

        public set rotation(value:number) {
            value = +value || 0;
            value = DisplayObject.clampRotation(value);
            if (value === this._rotation) {
                return;
            }
            var delta = value - this._rotation;
            var angle = delta / 180 * Math.PI;
            this._skewX += angle;
            this._skewY += angle;
            this._rotation = value;
            this.$invalidateMatrix();

        }

        /**
         * 表示显示对象的宽度，以像素为单位。
         * 宽度是根据显示对象内容的范围来计算的。优先顺序为 显式设置宽度 > 测量宽度。
         */
        public get width():number {
            return this.$getTransformedBounds(this.$parent, Rectangle.TEMP).width;
        }

        public set width(value:number) {
            value = +value || 0;
            if (value < 0) {
                return;
            }
            var contentBounds = this.$getContentBounds();
            var bounds = this.$getTransformedBounds(this.$parent, Rectangle.TEMP);
            var angle = this._rotation / 180 * Math.PI;
            var baseWidth = contentBounds.$getBaseWidth(angle);
            if (!baseWidth) {
                return;
            }
            var baseHeight = contentBounds.$getBaseHeight(angle);
            this._scaleY = bounds.height / baseHeight;
            this._scaleX = value / baseWidth;
            this.$invalidateMatrix();
        }

        /**
         * 表示显示对象的高度，以像素为单位。
         * 高度是根据显示对象内容的范围来计算的。优先顺序为 显式设置高度 > 测量高度。
         */
        public get height():number {
            return this.$getTransformedBounds(this.$parent, Rectangle.TEMP).height;
        }

        public set height(value:number) {
            value = +value || 0;
            if (value < 0) {
                return;
            }
            var contentBounds = this.$getContentBounds();
            var bounds = this.$getTransformedBounds(this.$parent, Rectangle.TEMP);
            var angle = this._rotation / 180 * Math.PI;
            var baseHeight = contentBounds.$getBaseHeight(angle);
            if (!baseHeight) {
                return;
            }
            var baseWidth = contentBounds.$getBaseWidth(angle);
            this._scaleY = value / baseHeight;
            this._scaleX = bounds.width / baseWidth;
            this.$invalidateMatrix();
        }

        /**
         * 显示对象是否可见。
         * 不可见的显示对象已被禁用。例如，如果实例的 visible=false，则无法单击该对象。
         * 默认值为 true 可见
         */
        public get visible():boolean {
            return this.$hasFlags(DisplayObjectFlags.Visible);
        }

        public set visible(value:boolean) {
            value = !!value;
            if (value === this.$hasFlags(DisplayObjectFlags.Visible)) {
                return;
            }
            if (this.$stage) {
                this.$stage.$displayListTreeChanged = true;
            }
            this.$toggleFlags(DisplayObjectFlags.Visible, value);
            this.$markDirty();
        }

        private _alpha:number = 1;
        /**
         * 表示指定对象的 Alpha 透明度值。
         * 有效值为 0（完全透明）到 1（完全不透明）。alpha 设置为 0 的显示对象是活动的，即使它们不可见。
         *  @default 1 默认值为 1。
         */
        public get alpha():number {
            return this._alpha;
        }

        public set alpha(value:number) {
            value = +value || 0;
            if (value === this._alpha) {
                return;
            }
            this._alpha = value;
            this.$propagateFlagsDown(DisplayObjectFlags.InvalidConcatenatedAlpha);
            this.$markDirty();
        }

        private _concatenatedAlpha:number = 1;

        /**
         * 获取这个显示对象跟它所有父级透明度的乘积
         */
        $getConcatenatedAlpha():number {
            if (this.$hasFlags(DisplayObjectFlags.InvalidConcatenatedAlpha)) {
                if (this.$parent) {
                    var parentAlpha = this.$parent.$getConcatenatedAlpha();
                    this._concatenatedAlpha = parentAlpha * this._alpha;
                }
                else {
                    this._concatenatedAlpha = this._alpha;
                }
                this.$removeFlags(DisplayObjectFlags.InvalidConcatenatedAlpha);
            }
            return this._concatenatedAlpha;
        }

        $touchEnabled:boolean = true;

        /**
         * 指定此对象是否接收鼠标/触摸事件
         * @default true 默认为 true 即可以接收。
         */
        public get touchEnabled():boolean {
            return this.$touchEnabled;
        }

        public set touchEnabled(value:boolean) {
            this.$touchEnabled = !!value;
        }


        private _scrollRect:Rectangle = null;
        /**
         * 显示对象的滚动矩形范围。显示对象被裁切为矩形定义的大小，当您更改 scrollRect 对象的 x 和 y 属性时，它会在矩形内滚动。
         */
        public get scrollRect():Rectangle {
            return this._scrollRect;
        }

        public set scrollRect(value:Rectangle) {
            this._scrollRect = value;
        }

        private _blendMode:string = null;
        /**
         * BlendMode 类中的一个值，用于指定要使用的混合模式。
         * 内部绘制位图的方法有两种。 如果启用了混合模式或外部剪辑遮罩，则将通过向矢量渲染器添加有位图填充的正方形来绘制位图。
         * 如果尝试将此属性设置为无效值，则运行时会将此值设置为 BlendMode.NORMAL。
         */
        public get blendMode():string {
            return this._blendMode;
        }

        public set blendMode(value:string) {
            this._blendMode = value;
        }

        private _mask:DisplayObject;
        /**
         * 调用显示对象被指定的 mask 对象遮罩。要确保当舞台缩放时蒙版仍然有效，mask 显示对象必须处于显示列表的活动部分。
         * 但不绘制 mask 对象本身。将 mask 设置为 null 可删除蒙版。要能够缩放遮罩对象，它必须在显示列表中。要能够拖动蒙版
         * Sprite 对象，它必须在显示列表中。当将 cacheAsBitmap 属性设置为 true，将 cacheAsBitmapMatrix 属性设置为 Matrix
         * 对象来缓存显示对象时，遮罩对象和被遮罩的显示对象必须是同一缓存位图的一部分。因此，如果缓存显示对象，则遮罩必须是显示
         * 对象的子级。如果缓存显示列表上的显示对象的祖代，则遮罩必须是该祖代的子级或其后代之一。如果缓存遮罩对象的多个祖代，
         * 则遮罩必须是显示列表中离遮罩对象最近的缓存容器的后代。
         * 注意：单个 mask 对象不能用于遮罩多个执行调用的显示对象。在将 mask 分配给第二个显示对象时，会撤消其作为第一个对象的遮罩，
         * 该对象的 mask 属性将变为 null。
         */
        public get mask():DisplayObject {
            return this._mask;
        }

        public set mask(value:DisplayObject) {
            this._mask = value;
        }

        /**
         * 返回一个矩形，该矩形定义相对于 targetCoordinateSpace 对象坐标系的显示对象区域。
         * @param targetCoordinateSpace 定义要使用的坐标系的显示对象。
         * @param resultRect 引擎建议尽可能减少创建对象次数来优化性能，可以从外部传入一个复用的Rectangle对象来存储结果，
         * 若不传入将创建一个新的Rectangle对象返回。
         * @returns 定义与 targetCoordinateSpace 对象坐标系统相关的显示对象面积的矩形。
         */
        public getBounds(targetCoordinateSpace:DisplayObject, resultRect?:Rectangle):Rectangle {
            targetCoordinateSpace = targetCoordinateSpace || this;
            return this.$getTransformedBounds(targetCoordinateSpace, resultRect);
        }

        $getTransformedBounds(targetCoordinateSpace:DisplayObject, resultRect?:Rectangle):Rectangle {
            var bounds = this.$getContentBounds();
            if (!resultRect) {
                resultRect = new Rectangle();
            }
            resultRect.copyFrom(bounds);
            if (targetCoordinateSpace === this || resultRect.isEmpty()) {
                return resultRect;
            }
            var m:Matrix;
            if (targetCoordinateSpace) {
                m = Matrix.TEMP;
                var invertedTargetMatrix = targetCoordinateSpace.$getInvertedConcatenatedMatrix();
                invertedTargetMatrix.$preMultiplyInto(this.$getConcatenatedMatrix(), m);
            } else {
                m = this.$getConcatenatedMatrix();
            }
            m.$transformBounds(resultRect);
            return resultRect;
        }

        /**
         * 将从舞台（全局）坐标转换为显示对象的（本地）坐标。
         * @param stageX 舞台坐标x
         * @param stageY 舞台坐标y
         * @param resultPoint 引擎建议尽可能减少创建对象次数来优化性能，可以从外部传入一个复用的Point对象来存储结果，
         * 若不传入将创建一个新的Point对象返回。
         * @returns 具有相对于显示对象的坐标的 Point 对象。
         */
        public globalToLocal(stageX:number, stageY:number, resultPoint?:Point):Point {
            var m = this.$getInvertedConcatenatedMatrix();
            return m.transformPoint(stageX, stageY, resultPoint);
        }

        /**
         * 将从舞台（全局）坐标转换为显示对象的（本地）坐标。
         * @param localX 舞台坐标x
         * @param localY 舞台坐标y
         * @param resultPoint 引擎建议尽可能减少创建对象次数来优化性能，可以从外部传入一个复用的Point对象来存储结果，
         * 若不传入将创建一个新的Point对象返回。
         * @returns 具有相对于显示对象的坐标的 Point 对象。
         */
        public localToGlobal(localX:number, localY:number, resultPoint?:Point):Point {
            var m = this.$getConcatenatedMatrix();
            return m.transformPoint(localX, localY, resultPoint);
        }


        /**
         * 标记自身的测量尺寸失效
         */
        $invalidateContentBounds():void {
            this.$markDirty();
            this.$propagateFlagsUp(DisplayObjectFlags.InvalidContentBounds);
        }

        private _contentBounds:Rectangle = new Rectangle();
        /**
         * 获取自身占用的矩形区域，如果是容器，还包括所有子项占据的区域。
         */
        $getContentBounds():Rectangle {
            var bounds = this._contentBounds;
            if (this.$hasFlags(DisplayObjectFlags.InvalidContentBounds)) {
                this.$removeFlags(DisplayObjectFlags.InvalidContentBounds);
                if (this.$renderNode) {
                    this.$renderNode.moved = true;
                }
                this.$measureContentBounds(bounds);
            }
            return bounds;
        }

        /**
         * 测量自身占用的矩形区域，如果是容器，还包括所有子项占据的区域。
         * @param bounds 测量结果存储在这个矩形对象内
         */
        $measureContentBounds(bounds:Rectangle):void {

        }

        $renderNode:lark.player.RenderNode = null;

        /**
         * 之前若调用过$markDirty()方法，此方法在绘制阶段会自动被调用，它负责将自身的属性改变同步到RenderNode，并清空相关的Dirty标记。
         * 注意：此方法里禁止添加移除显示子项或执行其他可能产生新的Dirty标记的操作，仅执行同步操作，否则可能导致屏幕绘制错误。
         */
        $updateRenderNode():void {
            this.$removeFlagsUp(DisplayObjectFlags.Dirty);
            var node = this.$renderNode;
            node.alpha = this.$getConcatenatedAlpha();
            node.matrix = this.$getConcatenatedMatrix();
            node.bounds = this.$getContentBounds();
        }

        /**
         * 标记此显示对象需要重绘，调用此方法后，在屏幕绘制阶段$updateRenderNode()方法会自动被回调，您可能需要覆盖它来同步自身改变的属性到目标RenderNode。
         */
        $markDirty():void {
            var dirtyNodes = this.$stage ? this.$stage.$dirtyRenderNodes : null;
            this.markChildDirty(this, dirtyNodes);
        }

        private markChildDirty(child:DisplayObject, dirtyNodes:{[key:number]:lark.player.RenderNode}):void {
            if (child.$hasFlags(DisplayObjectFlags.Dirty)) {
                return;
            }
            child.$setFlags(DisplayObjectFlags.Dirty);
            var node = child.$renderNode;
            if (node && dirtyNodes) {
                dirtyNodes[node.hashCode] = node;
            }
            var children = child.$children;
            if (children) {
                for (var i = children.length - 1; i >= 0; i--) {
                    this.markChildDirty(children[i], dirtyNodes);
                }
            }
        }

        /**
         * 计算显示对象，以确定它是否与 x 和 y 参数指定的点重叠或相交。x 和 y 参数指定舞台的坐标空间中的点，
         * 而不是包含显示对象的显示对象容器中的点（除非显示对象容器是舞台）。
         * @param stageX 要测试的舞台 x 坐标。
         * @param stageY 要测试的舞台 y 坐标。
         * @param shapeFlag 是检查对象 (true) 的实际像素，还是只检查边框 (false)。
         * @returns {boolean} 如果显示对象与指定的点重叠或相交，则为 true；否则为 false。
         */
        public hitTestPoint(stageX:number, stageY:number, shapeFlag:boolean):boolean {
            //var testingType = shapeFlag ?
            //    player.HitTestingType.HitTestShape :
            //    player.HitTestingType.HitTestBounds;
            //return this.$containsGlobalPoint(stageX,stageY,testingType,null);
            return false;
        }

        $hitTest(stageX:number, stageY:number):DisplayObject {
            if (!this.$touchEnabled || !this.$renderNode || !this.$hasFlags(DisplayObjectFlags.Visible)) {
                return null;
            }
            var m = this.$getInvertedConcatenatedMatrix();
            var bounds = this.$getContentBounds();
            var localX = m.a * stageX + m.c * stageY + m.tx;
            var localY = m.b * stageX + m.d * stageY + m.ty;
            if (bounds.contains(localX, localY)) {
                return this;
            }
            return null;
        }

        static $enterFrameCallBackList:lark.player.EventBin[] = [];
        static $renderCallBackList:lark.player.EventBin[] = [];

        public addEventListener(type:string, listener:(event:Event)=>void, thisObject:any, useCapture?:boolean, priority:number = 0):void {
            super.addEventListener(type, listener, thisObject, useCapture, priority);
            var isEnterFrame = (type == Event.ENTER_FRAME);
            if (isEnterFrame || type == Event.RENDER) {
                var list:Array<any> = isEnterFrame ? DisplayObject.$enterFrameCallBackList : DisplayObject.$renderCallBackList;
                this.$insertEventBin(list, listener, thisObject, priority, this);
            }
        }

        public removeEventListener(type:string, listener:(event:Event)=>void, thisObject:any, useCapture?:boolean):void {
            super.removeEventListener(type, listener, thisObject, useCapture);
            var isEnterFrame:boolean = (type == Event.ENTER_FRAME);
            if (isEnterFrame || type == Event.RENDER) {
                var list = isEnterFrame ? DisplayObject.$enterFrameCallBackList : DisplayObject.$renderCallBackList;
                this.$removeEventBin(list, listener, thisObject, this);
            }
        }

        public dispatchEvent(event:Event):boolean {
            if (!event.$bubbles) {
                return super.dispatchEvent(event);
            }

            var list:Array<DisplayObject> = [];
            var target:DisplayObject = this;
            while (target) {
                list.push(target);
                target = target.$parent;
            }
            event.$target = this;
            this.$dispatchPropagationEvent(event, list);
            return !event.$isDefaultPrevented;
        }

        $dispatchPropagationEvent(event:Event, list:DisplayObject[]):void {
            var length:number = list.length;
            var eventPhase:number = EventPhase.CAPTURING_PHASE;
            for (var i:number = length - 1; i >= 0; i--) {
                var currentTarget:DisplayObject = list[i];
                event.$currentTarget = currentTarget;
                event.$eventPhase = eventPhase;
                currentTarget.$notifyListener(event);
                if (event.$isPropagationStopped || event.$isPropagationImmediateStopped) {
                    return;
                }
            }

            var eventPhase:number = EventPhase.AT_TARGET;
            var currentTarget:DisplayObject = list[0];
            event.$currentTarget = currentTarget;
            event.$eventPhase = eventPhase;
            currentTarget.$notifyListener(event);
            if (event.$isPropagationStopped || event.$isPropagationImmediateStopped) {
                return;
            }

            var eventPhase:number = EventPhase.BUBBLING_PHASE;
            for (i = 1; i < length; i++) {
                var currentTarget:DisplayObject = list[i];
                event.$currentTarget = currentTarget;
                event.$eventPhase = eventPhase;
                currentTarget.$notifyListener(event);
                if (event.$isPropagationStopped || event.$isPropagationImmediateStopped) {
                    return;
                }
            }
        }

        public willTrigger(type:string):boolean {
            var parent = this;
            while (parent) {
                if (parent.hasEventListener(type))
                    return true;
                parent = parent.$parent;
            }
            return false;
        }

    }

}
//module lark.player{
//    /**
//     * 碰撞检测类型
//     */
//    export enum HitTestingType {
//        HitTestBounds,
//        HitTestShape,
//        Mouse,
//    }
//}