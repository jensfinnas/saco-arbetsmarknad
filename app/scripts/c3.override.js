/*
Override the c3_axis functions in order to redefine the deafult values for the 
tick labels.
Find 'OVERRIDE' to see where.
*/

var c3_chart_internal_fn = window.c3.chart.internal.fn;

function c3_axis_custom(d3, params) {
    var scale = d3.scale.linear(), orient = "bottom", innerTickSize = 6, outerTickSize, tickPadding = 3, tickValues = null, tickFormat, tickArguments;

    var tickOffset = 0, tickCulling = true, tickCentered;

    params = params || {};
    outerTickSize = params.withOuterTick ? 6 : 0;

    function axisX(selection, x) {
        selection.attr("transform", function (d) {
            return "translate(" + Math.ceil(x(d) + tickOffset) + ", 0)";
        });
    }
    function axisY(selection, y) {
        selection.attr("transform", function (d) {
            return "translate(0," + Math.ceil(y(d)) + ")";
        });
    }
    function scaleExtent(domain) {
        var start = domain[0], stop = domain[domain.length - 1];
        return start < stop ? [ start, stop ] : [ stop, start ];
    }
    function generateTicks(scale) {
        var i, domain, ticks = [];
        if (scale.ticks) {
            return scale.ticks.apply(scale, tickArguments);
        }
        domain = scale.domain();
        for (i = Math.ceil(domain[0]); i < domain[1]; i++) {
            ticks.push(i);
        }
        if (ticks.length > 0 && ticks[0] > 0) {
            ticks.unshift(ticks[0] - (ticks[1] - ticks[0]));
        }
        return ticks;
    }
    function copyScale() {
        var newScale = scale.copy(), domain;
        if (params.isCategory) {
            domain = scale.domain();
            newScale.domain([domain[0], domain[1] - 1]);
        }
        return newScale;
    }
    function textFormatted(v) {
        return tickFormat ? tickFormat(v) : v;
    }
    var tickTextCharSize;
    function getSizeFor1Char(tick) {
        if (tickTextCharSize) {
            return tickTextCharSize;
        }
        var size = {
            h: 10,
            w: 5.5
        };
        tick.select('text').text(textFormatted).each(function (d) {
            var box = this.getBoundingClientRect(),
                text = textFormatted(d),
                // OVERRIDE: This default value has been changed manually
                h = box.height * 0.7,
                w = text ? (box.width / text.length) : undefined;
            if (h && w) {
                size.h = h;
                size.w = w;
            }
        }).text('');
        tickTextCharSize = size;
        return size;
    }
    function axis(g) {
        g.each(function () {
            var g = d3.select(this);
            var scale0 = this.__chart__ || scale, scale1 = this.__chart__ = copyScale();

            var ticks = tickValues ? tickValues : generateTicks(scale1),
                tick = g.selectAll(".tick").data(ticks, scale1),
                tickEnter = tick.enter().insert("g", ".domain").attr("class", "tick").style("opacity", 1e-6),
                // MEMO: No exit transition. The reason is this transition affects max tick width calculation because old tick will be included in the ticks.
                tickExit = tick.exit().remove(),
                tickUpdate = d3.transition(tick).style("opacity", 1),
                tickTransform, tickX, tickY;

            var range = scale.rangeExtent ? scale.rangeExtent() : scaleExtent(scale.range()),
                path = g.selectAll(".domain").data([ 0 ]),
                pathUpdate = (path.enter().append("path").attr("class", "domain"), d3.transition(path));
            tickEnter.append("line");
            tickEnter.append("text");

            var lineEnter = tickEnter.select("line"),
                lineUpdate = tickUpdate.select("line"),
                textEnter = tickEnter.select("text"),
                textUpdate = tickUpdate.select("text");

            if (params.isCategory) {
                tickOffset = Math.ceil((scale1(1) - scale1(0)) / 2);
                tickX = tickCentered ? 0 : tickOffset;
                tickY = tickCentered ? tickOffset : 0;
            } else {
                tickOffset = tickX = 0;
            }

            var text, tspan, sizeFor1Char = getSizeFor1Char(g.select('.tick')), counts = [];
            var tickLength = Math.max(innerTickSize, 0) + tickPadding,
                isVertical = orient === 'left' || orient === 'right';

            // this should be called only when category axis
            function splitTickText(d, maxWidth) {
                var tickText = textFormatted(d),
                    subtext, spaceIndex, textWidth, splitted = [];

                if (Object.prototype.toString.call(tickText) === "[object Array]") {
                    return tickText;
                }

                if (!maxWidth || maxWidth <= 0) {
                    // OVERRIDE: This default value has been changed manually
                    maxWidth = isVertical ? 130 : params.isCategory ? (Math.ceil(scale1(ticks[1]) - scale1(ticks[0])) - 12) : 110;
                }

                function split(splitted, text) {
                    spaceIndex = undefined;
                    for (var i = 1; i < text.length; i++) {
                        if (text.charAt(i) === ' ') {
                            spaceIndex = i;
                        }
                        subtext = text.substr(0, i + 1);
                        textWidth = sizeFor1Char.w * subtext.length;
                        // if text width gets over tick width, split by space index or crrent index
                        if (maxWidth < textWidth) {
                            return split(
                                splitted.concat(text.substr(0, spaceIndex ? spaceIndex : i)),
                                text.slice(spaceIndex ? spaceIndex + 1 : i)
                            );
                        }
                    }
                    return splitted.concat(text);
                }

                return split(splitted, tickText + "");
            }

            function tspanDy(d, i) {
                var dy = sizeFor1Char.h;
                if (i === 0) {
                    if (orient === 'left' || orient === 'right') {
                        dy = -((counts[d.index] - 1) * (sizeFor1Char.h / 2) - 3);
                    } else {
                        dy = ".71em";
                    }
                }
                return dy;
            }

            function tickSize(d) {
                var tickPosition = scale(d) + (tickCentered ? 0 : tickOffset);
                return range[0] < tickPosition && tickPosition < range[1] ? innerTickSize : 0;
            }

            text = tick.select("text");
            tspan = text.selectAll('tspan')
                .data(function (d, i) {
                    var splitted = params.tickMultiline ? splitTickText(d, params.tickWidth) : [].concat(textFormatted(d));
                    counts[i] = splitted.length;
                    return splitted.map(function (s) {
                        return { index: i, splitted: s };
                    });
                });
            tspan.enter().append('tspan');
            tspan.exit().remove();
            tspan.text(function (d) { return d.splitted; });

            switch (orient) {
            case "bottom":
                {
                    tickTransform = axisX;
                    lineEnter.attr("y2", innerTickSize);
                    textEnter.attr("y", tickLength);
                    lineUpdate.attr("x1", tickX).attr("x2", tickX).attr("y2", tickSize);
                    textUpdate.attr("x", 0).attr("y", tickLength);
                    text.style("text-anchor", "middle");
                    tspan.attr('x', 0).attr("dy", tspanDy);
                    pathUpdate.attr("d", "M" + range[0] + "," + outerTickSize + "V0H" + range[1] + "V" + outerTickSize);
                    break;
                }
            case "top":
                {
                    tickTransform = axisX;
                    lineEnter.attr("y2", -innerTickSize);
                    textEnter.attr("y", -tickLength);
                    lineUpdate.attr("x2", 0).attr("y2", -innerTickSize);
                    textUpdate.attr("x", 0).attr("y", -tickLength);
                    text.style("text-anchor", "middle");
                    tspan.attr('x', 0).attr("dy", "0em");
                    pathUpdate.attr("d", "M" + range[0] + "," + -outerTickSize + "V0H" + range[1] + "V" + -outerTickSize);
                    break;
                }
            case "left":
                {
                    tickTransform = axisY;
                    lineEnter.attr("x2", -innerTickSize);
                    textEnter.attr("x", -tickLength);
                    lineUpdate.attr("x2", -innerTickSize).attr("y1", tickY).attr("y2", tickY);
                    textUpdate.attr("x", -tickLength).attr("y", tickOffset);
                    text.style("text-anchor", "end");
                    tspan.attr('x', -tickLength).attr("dy", tspanDy);
                    pathUpdate.attr("d", "M" + -outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + -outerTickSize);
                    break;
                }
            case "right":
                {
                    tickTransform = axisY;
                    lineEnter.attr("x2", innerTickSize);
                    textEnter.attr("x", tickLength);
                    lineUpdate.attr("x2", innerTickSize).attr("y2", 0);
                    textUpdate.attr("x", tickLength).attr("y", 0);
                    text.style("text-anchor", "start");
                    tspan.attr('x', tickLength).attr("dy", tspanDy);
                    pathUpdate.attr("d", "M" + outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + outerTickSize);
                    break;
                }
            }
            if (scale1.rangeBand) {
                var x = scale1, dx = x.rangeBand() / 2;
                scale0 = scale1 = function (d) {
                    return x(d) + dx;
                };
            } else if (scale0.rangeBand) {
                scale0 = scale1;
            } else {
                tickExit.call(tickTransform, scale1);
            }
            tickEnter.call(tickTransform, scale0);
            tickUpdate.call(tickTransform, scale1);
        });
    }
    axis.scale = function (x) {
        if (!arguments.length) { return scale; }
        scale = x;
        return axis;
    };
    axis.orient = function (x) {
        if (!arguments.length) { return orient; }
        orient = x in {top: 1, right: 1, bottom: 1, left: 1} ? x + "" : "bottom";
        return axis;
    };
    axis.tickFormat = function (format) {
        if (!arguments.length) { return tickFormat; }
        tickFormat = format;
        return axis;
    };
    axis.tickCentered = function (isCentered) {
        if (!arguments.length) { return tickCentered; }
        tickCentered = isCentered;
        return axis;
    };
    axis.tickOffset = function () { // This will be overwritten when normal x axis
        return tickOffset;
    };
    axis.ticks = function () {
        if (!arguments.length) { return tickArguments; }
        tickArguments = arguments;
        return axis;
    };
    axis.tickCulling = function (culling) {
        if (!arguments.length) { return tickCulling; }
        tickCulling = culling;
        return axis;
    };
    axis.tickValues = function (x) {
        if (typeof x === 'function') {
            tickValues = function () {
                return x(scale.domain());
            };
        }
        else {
            if (!arguments.length) { return tickValues; }
            tickValues = x;
        }
        return axis;
    };
    return axis;
}

c3_chart_internal_fn.getXAxis = function (scale, orient, tickFormat, tickValues, withOuterTick) {
    var $$ = this, config = $$.config,
        axisParams = {
            isCategory: $$.isCategorized(),
            withOuterTick: withOuterTick,
            tickMultiline: config.axis_x_tick_multiline,
            tickWidth: config.axis_x_tick_width
        },
        axis = c3_axis_custom($$.d3, axisParams).scale(scale).orient(orient);

    if ($$.isTimeSeries() && tickValues) {
        tickValues = tickValues.map(function (v) { return $$.parseDate(v); });
    }

    // Set tick
    axis.tickFormat(tickFormat).tickValues(tickValues);
    if ($$.isCategorized()) {
        axis.tickCentered(config.axis_x_tick_centered);
        if (isEmpty(config.axis_x_tick_culling)) {
            config.axis_x_tick_culling = false;
        }
    } else {
        // TODO: move this to c3_axis
        axis.tickOffset = function () {
            var scale = this.scale(),
                edgeX = $$.getEdgeX($$.data.targets), diff = scale(edgeX[1]) - scale(edgeX[0]),
                base = diff ? diff : (config.axis_rotated ? $$.height : $$.width);
            return (base / $$.getMaxDataCount()) / 2;
        };
    }

    return axis;
};
c3_chart_internal_fn.getYAxis = function (scale, orient, tickFormat, tickValues, withOuterTick) {
    var axisParams = {withOuterTick: withOuterTick},
        axis = c3_axis_custom(this.d3, axisParams).scale(scale).orient(orient).tickFormat(tickFormat);
    if (this.isTimeSeriesY()) {
        axis.ticks(this.d3.time[this.config.axis_y_tick_time_value], this.config.axis_y_tick_time_interval);
    } else {
        axis.tickValues(tickValues);
    }
    return axis;
};

var isValue = c3_chart_internal_fn.isValue = function (v) {
        return v || v === 0;
    },
        isFunction = c3_chart_internal_fn.isFunction = function (o) {
            return typeof o === 'function';
        },
        isString = c3_chart_internal_fn.isString = function (o) {
            return typeof o === 'string';
        },
        isUndefined = c3_chart_internal_fn.isUndefined = function (v) {
            return typeof v === 'undefined';
        },
        isDefined = c3_chart_internal_fn.isDefined = function (v) {
            return typeof v !== 'undefined';
        },
        ceil10 = c3_chart_internal_fn.ceil10 = function (v) {
            return Math.ceil(v / 10) * 10;
        },
        asHalfPixel = c3_chart_internal_fn.asHalfPixel = function (n) {
            return Math.ceil(n) + 0.5;
        },
        diffDomain = c3_chart_internal_fn.diffDomain = function (d) {
            return d[1] - d[0];
        },
        isEmpty = c3_chart_internal_fn.isEmpty = function (o) {
            return !o || (isString(o) && o.length === 0) || (typeof o === 'object' && Object.keys(o).length === 0);
        },
        notEmpty = c3_chart_internal_fn.notEmpty = function (o) {
            return Object.keys(o).length > 0;
        },
        getOption = c3_chart_internal_fn.getOption = function (options, key, defaultValue) {
            return isDefined(options[key]) ? options[key] : defaultValue;
        },
        hasValue = c3_chart_internal_fn.hasValue = function (dict, value) {
            var found = false;
            Object.keys(dict).forEach(function (key) {
                if (dict[key] === value) { found = true; }
            });
            return found;
        },
        getPathBox = c3_chart_internal_fn.getPathBox = function (path) {
            var box = path.getBoundingClientRect(),
                items = [path.pathSegList.getItem(0), path.pathSegList.getItem(1)],
                minX = items[0].x, minY = Math.min(items[0].y, items[1].y);
            return {x: minX, y: minY, width: box.width, height: box.height};
        };