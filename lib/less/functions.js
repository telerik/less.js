(function (tree) {

tree.functions = {
    rgb: function (r, g, b) {
        return this.rgba(r, g, b, 1.0);
    },
    rgba: function (r, g, b, a) {
        var rgb = [r, g, b].map(function (c) { return number(c) }),
            a = number(a);
        return new(tree.Color)(rgb, a);
    },
    hsl: function (h, s, l) {
        return this.hsla(h, s, l, 1.0);
    },
    hsla: function (h, s, l, a) {
        h = (number(h) % 360) / 360;
        s = number(s); l = number(l); a = number(a);

        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;

        return this.rgba(hue(h + 1/3) * 255,
                         hue(h)       * 255,
                         hue(h - 1/3) * 255,
                         a);

        function hue(h) {
            h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
            if      (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
            else if (h * 2 < 1) return m2;
            else if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
            else                return m1;
        }
    },
    hue: function (color) {
        return new(tree.Dimension)(Math.round(color.toHSL().h));
    },
    saturation: function (color) {
        return new(tree.Dimension)(Math.round(color.toHSL().s * 100), '%');
    },
    lightness: function (color) {
        return new(tree.Dimension)(Math.round(color.toHSL().l * 100), '%');
    },
    alpha: function (color) {
        return new(tree.Dimension)(color.toHSL().a);
    },
    luma: function (color) {
        return new(tree.Dimension)(Math.round((0.2126 * (color.rgb[0]/255) +
            0.7152 * (color.rgb[1]/255) +
            0.0722 * (color.rgb[2]/255))
            * color.alpha * 100), '%');
    },
    saturate: function (color, amount) {
        var hsl = color.toHSL();

        hsl.s += amount.value / 100;
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    desaturate: function (color, amount) {
        var hsl = color.toHSL();

        hsl.s -= amount.value / 100;
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    lighten: function (color, amount) {
        var hsl = color.toHSL();

        hsl.l += amount.value / 100;
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    darken: function (color, amount) {
        var hsl = color.toHSL();

        hsl.l -= amount.value / 100;
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    fadein: function (color, amount) {
        var hsl = color.toHSL();

        hsl.a += amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    fadeout: function (color, amount) {
        var hsl = color.toHSL();

        hsl.a -= amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    fade: function (color, amount) {
        var hsl = color.toHSL();

        hsl.a = amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    spin: function (color, amount) {
        var hsl = color.toHSL();
        var hue = (hsl.h + amount.value) % 360;

        hsl.h = hue < 0 ? 360 + hue : hue;

        return hsla(hsl);
    },
    //
    // Copyright (c) 2006-2009 Hampton Catlin, Nathan Weizenbaum, and Chris Eppstein
    // http://sass-lang.com
    //
    mix: function (color1, color2, weight) {
        if (!weight) {
            weight = new(tree.Dimension)(50);
        }
        var p = weight.value / 100.0;
        var w = p * 2 - 1;
        var a = color1.toHSL().a - color2.toHSL().a;

        var w1 = (((w * a == -1) ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
        var w2 = 1 - w1;

        var rgb = [color1.rgb[0] * w1 + color2.rgb[0] * w2,
                   color1.rgb[1] * w1 + color2.rgb[1] * w2,
                   color1.rgb[2] * w1 + color2.rgb[2] * w2];

        var alpha = color1.alpha * p + color2.alpha * (1 - p);

        return new(tree.Color)(rgb, alpha);
    },
    greyscale: function (color) {
        return this.desaturate(color, new(tree.Dimension)(100));
    },
    contrast: function (color, dark, light, threshold) {
        if (typeof light === 'undefined') {
            light = this.rgba(255, 255, 255, 1.0);
        }
        if (typeof dark === 'undefined') {
            dark = this.rgba(0, 0, 0, 1.0);
        }
        if (typeof threshold === 'undefined') {
            threshold = 0.43;
        } else {
            threshold = threshold.value;
        }
        if (((0.2126 * (color.rgb[0]/255) + 0.7152 * (color.rgb[1]/255) + 0.0722 * (color.rgb[2]/255)) * color.alpha) < threshold) {
            return light;
        } else {
            return dark;
        }
    },
    e: function (str) {
        return new(tree.Anonymous)(str instanceof tree.JavaScript ? str.evaluated : str);
    },
    escape: function (str) {
        return new(tree.Anonymous)(encodeURI(str.value).replace(/=/g, "%3D").replace(/:/g, "%3A").replace(/#/g, "%23").replace(/;/g, "%3B").replace(/\(/g, "%28").replace(/\)/g, "%29"));
    },
    '%': function (quoted /* arg, arg, ...*/) {
        var args = Array.prototype.slice.call(arguments, 1),
            str = quoted.value;

        for (var i = 0; i < args.length; i++) {
            str = str.replace(/%[sda]/i, function(token) {
                var value = token.match(/s/i) ? args[i].value : args[i].toCSS();
                return token.match(/[A-Z]$/) ? encodeURIComponent(value) : value;
            });
        }
        str = str.replace(/%%/g, '%');
        return new(tree.Quoted)('"' + str + '"', str);
    },
    round: function (n) {
        return this._math('round', n);
    },
    ceil: function (n) {
        return this._math('ceil', n);
    },
    floor: function (n) {
        return this._math('floor', n);
    },
    _math: function (fn, n) {
        if (n instanceof tree.Dimension) {
            return new(tree.Dimension)(Math[fn](number(n)), n.unit);
        } else if (typeof(n) === 'number') {
            return Math[fn](n);
        } else {
            throw { type: "Argument", message: "argument must be a number" };
        }
    },
    argb: function (color) {
        return new(tree.Anonymous)(color.toARGB());

    },
    percentage: function (n) {
        return new(tree.Dimension)(n.value * 100, '%');
    },
    color: function (n) {
        if (n instanceof tree.Quoted) {
            return new(tree.Color)(n.value.slice(1));
        } else {
            throw { type: "Argument", message: "argument must be a string" };
        }
    },
    iscolor: function (n) {
        return this._isa(n, tree.Color);
    },
    isnumber: function (n) {
        return this._isa(n, tree.Dimension);
    },
    isstring: function (n) {
        return this._isa(n, tree.Quoted);
    },
    iskeyword: function (n) {
        return this._isa(n, tree.Keyword);
    },
    isurl: function (n) {
        return this._isa(n, tree.URL);
    },
    ispixel: function (n) {
        return (n instanceof tree.Dimension) && n.unit === 'px' ? tree.True : tree.False;
    },
    ispercentage: function (n) {
        return (n instanceof tree.Dimension) && n.unit === '%' ? tree.True : tree.False;
    },
    isem: function (n) {
        return (n instanceof tree.Dimension) && n.unit === 'em' ? tree.True : tree.False;
    },
    _isa: function (n, Type) {
        return (n instanceof Type) ? tree.True : tree.False;
    },
    "linear-gradient": function (/* arg, arg, ...*/) {
        var prefix = arguments[0].value ? "-" + arguments[0].value + "-" : "", i, len, lastIndex = 0, output = "";

        arguments = arguments.length > 2 ? arguments : arguments[1].value;

        for(i = 1, len = arguments.length; i < len; i++) {
            if ((arguments[i].value && typeof arguments[i].value == "string") || i == len-1) {
                var args = Array.prototype.slice.call(arguments, lastIndex + 1, i == len-1 ? i + 1 : i),

                    firstArg = arguments[lastIndex].value,
                    direction = arguments[lastIndex] instanceof tree.Expression ?
                                        [ directions[firstArg[0].value], directions[ firstArg[1].value ], firstArg[0].value + " " + firstArg[1].value ] :
                                        /left|right/.test(firstArg) ?
                                                [ directions[ firstArg ], directions[ "center" ], firstArg ] :
                                                [ directions[ "center" ], directions[ firstArg ], firstArg ],
                    directionStart = direction[0].value + " " + direction[1].value,
                    directionEnd = direction[0].limit + " " + direction[1].limit,
                    initial = prefix == "-webkit-" ? "gradient(linear, " + directionStart + ", " + directionEnd : "linear-gradient(" + direction[2];

                output += prefix + getGradient(args, initial, prefix == "-webkit-") + ",";

                lastIndex = i;
            }
        }

        return new(tree.Anonymous)(output.substring(0, output.length-1));
    }
};

function getGradient (args, initial, isWebKit) {
    var result = initial;

    for (var i = 0, len = args.length; i < len; i++) {
        var stop = args[i], dimension, rgba;

        if (stop instanceof tree.Color) {
            rgba = "," + stop.toCSS().replace(/ /g, "");
            result += isWebKit ? ", color-stop(" + (i==0 ? "0" : "1" ) + rgba.replace("transparent", "rgba(0,0,0,0)") + ")" : rgba;
        } else {
            dimension = stop.value[1];
            stop = stop.value[0];
            rgba = "," + stop.toCSS().replace(/ /g, "");
            result += isWebKit ? ", color-stop(" + (dimension.value/100) + rgba.replace("transparent", "rgba(0,0,0,0)") + ")" : rgba + " " + dimension.toCSS();
        }
    }

   return result + ")";
}

var directions = {
    top: {
        value: "0",
        limit: "100%"
    },
    bottom: {
        value: "100%",
        limit: "0"
    },
    left: {
        value: "0",
        limit: "100%"
    },
    right: {
        value: "100%",
        limit: "0"
    },
    center: {
        value: "50%",
        limit: "50%"
    }
};

function hsla(hsla) {
    return tree.functions.hsla(hsla.h, hsla.s, hsla.l, hsla.a);
}

function number(n) {
    if (n instanceof tree.Dimension) {
        return parseFloat(n.unit == '%' ? n.value / 100 : n.value);
    } else if (typeof(n) === 'number') {
        return n;
    } else {
        throw {
            error: "RuntimeError",
            message: "color functions take numbers as parameters"
        };
    }
}

function clamp(val) {
    return Math.min(1, Math.max(0, val));
}

})(require('./tree'));
