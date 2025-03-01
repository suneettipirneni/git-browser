// notebook.js 0.5.2
// http://github.com/jsvine/notebookjs
// notebook.js may be freely distributed under the MIT license.
// NOTE: This version of notebook has been modified to work in a React environment
(function () {
  var VERSION = "0.5.2";
  var DEBUG = process.env.DEBUG
  var root = this;

  // HOTFIX: Remove the JSDOM dependency and always assume the
  // document object is available on load
  var doc = document;

  // Helper functions
  var ident = function (x) {
    return x;
  };

  var makeElement = function (tag, classNames) {
    var el = doc.createElement(tag);
    el.className = (classNames || [])
      .map(function (cn) {
        return nb.prefix + cn;
      })
      .join(" ");
    return el;
  };

  var escapeHTML = function (raw) {
    // HOTFIX: Escaping HTML causes highlight.js to display
    // < and > as &lt; and &gt;
    return raw;
  };

  var joinText = function (text) {
    if (text.join) {
      return text.map(joinText).join("");
    } else {
      return text;
    }
  };

  var getMarkdown = function () {
    // HOTFIX: Remove require call to marked
    return root.marked || ident;
  };

  var getAnsi = function () {
    // HOTFIX: Remove require call to ansi
    var lib = root.ansi_up || ident;
    return lib && lib.ansi_to_html;
  };

  var getSanitizer = function () {
    // HOTFIX: Remove require call to DOMPurify
    var lib = root.DOMPurify || ident;
    return lib && lib.sanitize;
  };

  // Set up `nb` namespace
  var nb = {
    prefix: "nb-",
    markdown: getMarkdown() || ident,
    ansi: getAnsi() || ident,
    sanitizer: getSanitizer() || ident,
    highlighter: ident,
    VERSION: VERSION,
  };

  // Inputs
  nb.Input = function (raw, cell) {
    this.raw = raw;
    this.cell = cell;
  };

  nb.Input.prototype.render = function () {
    if (!this.raw.length) {
      return makeElement("div");
    }
    var holder = makeElement("div", ["input"]);
    var cell = this.cell;
    if (typeof cell.number === "number") {
      holder.setAttribute("data-prompt-number", this.cell.number);
    }
    var pre_el = makeElement("pre");
    var code_el = makeElement("code");
    var notebook = cell.worksheet.notebook;
    var m = notebook.metadata;
    var lang =
      this.cell.raw.language ||
      m.language ||
      (m.kernelspec && m.kernelspec.language) ||
      (m.language_info && m.language_info.name);
    code_el.setAttribute("data-language", lang);
    code_el.className = "lang-" + lang;
    code_el.innerHTML = nb.highlighter(
      escapeHTML(joinText(this.raw)),
      pre_el,
      code_el,
      lang
    );
    pre_el.appendChild(code_el);
    holder.appendChild(pre_el);
    this.el = holder;
    return holder;
  };

  // Outputs and output-renderers
  var imageCreator = function (format) {
    return function (data) {
      var el = makeElement("img", ["image-output"]);
      el.src =
        "data:image/" + format + ";base64," + joinText(data).replace(/\n/g, "");
      return el;
    };
  };

  nb.display = {};
  nb.display.text = function (text) {
    var el = makeElement("pre", ["text-output"]);
    el.innerHTML = escapeHTML(joinText(text));
    return el;
  };
  nb.display["text/plain"] = nb.display.text;

  nb.display.html = function (html) {
    var el = makeElement("div", ["html-output"]);
    el.innerHTML = nb.sanitizer(joinText(html));
    return el;
  };
  nb.display["text/html"] = nb.display.html;

  nb.display.marked = function (md) {
    return nb.display.html(nb.markdown(joinText(md)));
  };
  nb.display["text/markdown"] = nb.display.marked;

  nb.display.svg = function (svg) {
    var el = makeElement("div", ["svg-output"]);
    el.innerHTML = joinText(svg);
    return el;
  };
  nb.display["text/svg+xml"] = nb.display.svg;
  nb.display["image/svg+xml"] = nb.display.svg;

  nb.display.latex = function (latex) {
    var el = makeElement("div", ["latex-output"]);
    el.innerHTML = joinText(latex);
    return el;
  };
  nb.display["text/latex"] = nb.display.latex;

  nb.display.javascript = function (js) {
    var el = makeElement("script");
    el.innerHTML = joinText(js);
    return el;
  };
  nb.display["application/javascript"] = nb.display.javascript;

  nb.display.png = imageCreator("png");
  nb.display["image/png"] = nb.display.png;
  nb.display.jpeg = imageCreator("jpeg");
  nb.display["image/jpeg"] = nb.display.jpeg;

  nb.display_priority = [
    "png",
    "image/png",
    "jpeg",
    "image/jpeg",
    "svg",
    "image/svg+xml",
    "text/svg+xml",
    "html",
    "text/html",
    "text/markdown",
    "latex",
    "text/latex",
    "javascript",
    "application/javascript",
    "text",
    "text/plain",
  ];

  var render_display_data = function () {
    var o = this;
    var formats = nb.display_priority.filter(function (d) {
      return o.raw.data ? o.raw.data[d] : o.raw[d];
    });
    var format = formats[0];
    if (format) {
      if (nb.display[format]) {
        return nb.display[format](o.raw[format] || o.raw.data[format]);
      }
    }
    return makeElement("div", ["empty-output"]);
  };

  var render_error = function () {
    var el = makeElement("pre", ["pyerr"]);
    var raw = this.raw.traceback.join("\n");
    el.innerHTML = nb.highlighter(nb.ansi(escapeHTML(raw)), el);
    return el;
  };

  nb.Output = function (raw, cell) {
    this.raw = raw;
    this.cell = cell;
    this.type = raw.output_type;
  };

  nb.Output.prototype.renderers = {
    display_data: render_display_data,
    execute_result: render_display_data,
    pyout: render_display_data,
    pyerr: render_error,
    error: render_error,
    stream: function () {
      var el = makeElement("pre", [this.raw.stream || this.raw.name]);
      var raw = joinText(this.raw.text);
      el.innerHTML = nb.highlighter(nb.ansi(escapeHTML(raw)), el);
      return el;
    },
  };

  nb.Output.prototype.render = function () {
    var outer = makeElement("div", ["output"]);
    if (typeof this.cell.number === "number") {
      outer.setAttribute("data-prompt-number", this.cell.number);
    }
    var inner = this.renderers[this.type].call(this);
    outer.appendChild(inner);
    this.el = outer;
    return outer;
  };

  // Post-processing
  nb.coalesceStreams = function (outputs) {
    if (!outputs.length) {
      return outputs;
    }
    var last = outputs[0];
    var new_outputs = [last];
    outputs.slice(1).forEach(function (o) {
      if (
        o.raw.output_type === "stream" &&
        last.raw.output_type === "stream" &&
        o.raw.stream === last.raw.stream &&
        o.raw.name === last.raw.name
      ) {
        last.raw.text = last.raw.text.concat(o.raw.text);
      } else {
        new_outputs.push(o);
        last = o;
      }
    });
    return new_outputs;
  };

  // Cells
  nb.Cell = function (raw, worksheet) {
    var cell = this;
    cell.raw = raw;
    cell.worksheet = worksheet;
    cell.type = raw.cell_type;
    if (cell.type === "code") {
      cell.number =
        raw.prompt_number > -1 ? raw.prompt_number : raw.execution_count;
      var source = raw.input || [raw.source];
      cell.input = new nb.Input(source, cell);
      var raw_outputs = (cell.raw.outputs || []).map(function (o) {
        return new nb.Output(o, cell);
      });
      cell.outputs = nb.coalesceStreams(raw_outputs);
    }
  };

  nb.Cell.prototype.renderers = {
    markdown: function () {
      var el = makeElement("div", ["cell", "markdown-cell"]);
      el.innerHTML = nb.markdown(joinText(this.raw.source));

      /* Requires to render KaTeX
          'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.css',
          'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/contrib/auto-render.min.js',
          */
      // HOTFIX: Assume katex is a property of the window
      if (window.renderMathInElement != null) {
        // HOTFIX: katex auto renderer sometimes throws an error
        try {
          window.renderMathInElement(el, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "\\[", right: "\\]", display: true },
              { left: "\\(", right: "\\)", display: false },
              { left: "$", right: "$", display: false },
            ],
          });
        } catch(e) {
          if (DEBUG) {
            console.warn(e)
          }
        }
      }

      return el;
    },
    heading: function () {
      var el = makeElement("h" + this.raw.level, ["cell", "heading-cell"]);
      el.innerHTML = joinText(this.raw.source);
      return el;
    },
    raw: function () {
      var el = makeElement("div", ["cell", "raw-cell"]);
      el.innerHTML = joinText(this.raw.source);
      return el;
    },
    code: function () {
      var cell_el = makeElement("div", ["cell", "code-cell"]);
      cell_el.appendChild(this.input.render());
      var output_els = this.outputs.forEach(function (o) {
        cell_el.appendChild(o.render());
      });
      return cell_el;
    },
  };

  nb.Cell.prototype.render = function () {
    var el = this.renderers[this.type].call(this);
    this.el = el;
    return el;
  };

  // Worksheets
  nb.Worksheet = function (raw, notebook) {
    var worksheet = this;
    this.raw = raw;
    this.notebook = notebook;
    this.cells = raw.cells.map(function (c) {
      return new nb.Cell(c, worksheet);
    });
    this.render = function () {
      var worksheet_el = makeElement("div", ["worksheet"]);
      worksheet.cells.forEach(function (c) {
        worksheet_el.appendChild(c.render());
      });
      this.el = worksheet_el;
      return worksheet_el;
    };
  };

  // Notebooks
  nb.Notebook = function (raw, config) {
    var notebook = this;
    this.raw = raw;
    this.config = config;
    var meta = (this.metadata = raw.metadata || {});
    this.title = meta.title || meta.name;
    var _worksheets = raw.worksheets || [{ cells: raw.cells }];
    this.worksheets = _worksheets.map(function (ws) {
      return new nb.Worksheet(ws, notebook);
    });
    this.sheet = this.worksheets[0];
  };

  nb.Notebook.prototype.render = function () {
    var notebook_el = makeElement("div", ["notebook"]);
    this.worksheets.forEach(function (w) {
      notebook_el.appendChild(w.render());
    });
    this.el = notebook_el;
    return notebook_el;
  };

  nb.parse = function (nbjson, config) {
    return new nb.Notebook(nbjson, config);
  };

  // Exports
  if (typeof define === "function" && define.amd) {
    define(function () {
      return nb;
    });
  }
  if (typeof exports !== "undefined") {
    if (typeof module !== "undefined" && module.exports) {
      exports = module.exports = nb;
    }
    exports.nb = nb;
  } else {
    root.nb = nb;
  }
}.call(this));
