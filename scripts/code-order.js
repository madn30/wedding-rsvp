const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");

const EXTS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const ROOT = process.cwd();
const SCRIPT_NAME = path.basename(__filename);

// Use npx directly to avoid path issues with local node_modules
const PRETTIER = `npx prettier`;
const ESLINT = `npx eslint`;

const AUTO_IMPORTS = {
  React: { module: "react", isDefault: true },
  useState: { module: "react", isDefault: false },
  useEffect: { module: "react", isDefault: false },
  useRef: { module: "react", isDefault: false },
  Link: { module: "next/link", isDefault: true },
  Image: { module: "next/image", isDefault: true },
  User: { module: "lucide-react", isDefault: false },
  Home: { module: "lucide-react", isDefault: false },
};

function run(cmd) {
  try {
    execSync(cmd, { stdio: "ignore" });
  } catch {}
}

function parse(code, file) {
  try {
    return parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });
  } catch (err) {
    return null;
  }
}

function scanComponents(dir, baseAlias = "@/") {
  const map = {};
  if (!fs.existsSync(dir)) return map;

  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      if (
        ["node_modules", ".next", "dist", "build"].includes(file) ||
        file.startsWith(".")
      )
        continue;
      Object.assign(map, scanComponents(full, baseAlias));
      continue;
    }

    if (!EXTS.has(path.extname(full))) continue;

    const code = fs.readFileSync(full, "utf8");
    const ast = parse(code, full);
    if (!ast) continue;

    traverse(ast, {
      ExportDefaultDeclaration(p) {
        const decl = p.node.declaration;
        let name;
        if (t.isFunctionDeclaration(decl) && decl.id) name = decl.id.name;
        else if (t.isIdentifier(decl)) name = decl.name;
        else if (t.isClassDeclaration(decl) && decl.id) name = decl.id.name;

        if (name) {
          const relative = path.relative(path.join(ROOT, "src"), full);
          const importPath = path.posix
            .join(baseAlias.slice(0, -1), relative)
            .replace(/\\/g, "/")
            .replace(/\.(js|jsx|ts|tsx)$/, "");
          map[name] = { path: importPath, isDefault: true, definedIn: full };
        }
      },
      ExportNamedDeclaration(p) {
        if (p.node.declaration) {
          if (
            t.isFunctionDeclaration(p.node.declaration) &&
            p.node.declaration.id
          ) {
            const relative = path.relative(path.join(ROOT, "src"), full);
            const importPath = path.posix
              .join(baseAlias.slice(0, -1), relative)
              .replace(/\\/g, "/")
              .replace(/\.(js|jsx|ts|tsx)$/, "");
            map[p.node.declaration.id.name] = {
              path: importPath,
              isDefault: false,
              definedIn: full,
            };
          } else if (t.isVariableDeclaration(p.node.declaration)) {
            p.node.declaration.declarations.forEach((d) => {
              if (t.isIdentifier(d.id)) {
                const relative = path.relative(path.join(ROOT, "src"), full);
                const importPath = path.posix
                  .join(baseAlias.slice(0, -1), relative)
                  .replace(/\\/g, "/")
                  .replace(/\.(js|jsx|ts|tsx)$/, "");
                map[d.id.name] = {
                  path: importPath,
                  isDefault: false,
                  definedIn: full,
                };
              }
            });
          }
        }
      },
    });
  }
  return map;
}

function collectUsed(ast) {
  const used = new Set();
  traverse(ast, {
    Identifier(p) {
      if (
        p.isBindingIdentifier() ||
        p.parentPath.isImportSpecifier() ||
        p.parentPath.isImportDefaultSpecifier() ||
        p.parentPath.isImportNamespaceSpecifier()
      )
        return;
      used.add(p.node.name);
    },
    JSXIdentifier(p) {
      used.add(p.node.name);
    },
    TSTypeReference(p) {
      if (p.node.typeName && p.node.typeName.name)
        used.add(p.node.typeName.name);
    },
  });
  return used;
}

function collectImports(ast) {
  const imported = new Map();
  traverse(ast, {
    ImportDeclaration(p) {
      p.node.specifiers.forEach((s) => imported.set(s.local.name, s));
    },
  });
  return imported;
}

function addMissingImports(ast, used, imported, components, currentFile) {
  Object.entries(AUTO_IMPORTS).forEach(([name, info]) => {
    if (used.has(name) && !imported.has(name)) {
      const specifiers = info.isDefault
        ? [t.importDefaultSpecifier(t.identifier(name))]
        : [t.importSpecifier(t.identifier(name), t.identifier(name))];
      ast.program.body.unshift(
        t.importDeclaration(specifiers, t.stringLiteral(info.module)),
      );
    }
  });
  Object.entries(components).forEach(([name, info]) => {
    if (
      used.has(name) &&
      !imported.has(name) &&
      info.definedIn !== currentFile
    ) {
      const specifiers = info.isDefault
        ? [t.importDefaultSpecifier(t.identifier(name))]
        : [t.importSpecifier(t.identifier(name), t.identifier(name))];
      ast.program.body.unshift(
        t.importDeclaration(specifiers, t.stringLiteral(info.path)),
      );
    }
  });
}

function removeUnusedImports(ast, used) {
  traverse(ast, {
    ImportDeclaration(p) {
      p.node.specifiers = p.node.specifiers.filter((s) =>
        used.has(s.local.name),
      );
      if (p.node.specifiers.length === 0) p.remove();
    },
  });
}

function removeUnusedBindings(ast) {
  traverse(ast, {
    VariableDeclarator(p) {
      const id = p.node.id;
      const binding = p.scope.getBinding(id.name);
      if (t.isIdentifier(id) && binding && !binding.referenced) p.remove();
    },
  });
}

function cleanupStatements(ast) {
  traverse(ast, {
    CallExpression(p) {
      if (
        t.isMemberExpression(p.node.callee) &&
        t.isIdentifier(p.node.callee.object, { name: "console" })
      ) {
        p.remove();
      }
    },
    DebuggerStatement(p) {
      p.remove();
    },
  });
}

function transform(code, components, file) {
  const ast = parse(code, file);
  if (!ast) return code;
  const used = collectUsed(ast);
  const imported = collectImports(ast);
  removeUnusedImports(ast, used);
  removeUnusedBindings(ast);
  cleanupStatements(ast);
  addMissingImports(ast, used, imported, components, file);
  return generate(ast, { comments: false, retainLines: true }).code;
}

function processFile(file, components) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    const out = transform(raw, components, file);
    fs.writeFileSync(file, out);
  } catch (err) {}
}

function walk(dir, components) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (
      file === SCRIPT_NAME ||
      ["node_modules", ".next", "dist", "build"].includes(file) ||
      file.startsWith(".")
    )
      continue;

    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, components);
    } else if (EXTS.has(path.extname(full))) {
      processFile(full, components);
    }
  }
}

// --- START ---
console.log("🚀 Starting cleanup...");
const componentsDir = path.join(ROOT, "src/components");
const components = fs.existsSync(componentsDir)
  ? scanComponents(componentsDir)
  : {};

walk(ROOT, components);

console.log("✨ Formatting files...");
run(`${ESLINT} . --ext .js,.jsx,.ts,.tsx --fix`);
run(`${PRETTIER} --write .`);
console.log("✅ Done!");
