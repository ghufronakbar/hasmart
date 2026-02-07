#!/usr/bin/env node

/**
 * Module Generator Script
 * 
 * Usage:
 *   npm run gen:module -- --name <module-name> --prefix <prefix>
 * 
 * Examples:
 *   npm run gen:module -- --name supplier --prefix master
 *   npm run gen:module -- --name cache --prefix common
 */

const fs = require('fs');
const path = require('path');
const Mustache = require('mustache');

// Parse arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const result = { name: '', prefix: '' };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--name' && args[i + 1]) {
            result.name = args[i + 1];
            i++;
        } else if (args[i] === '--prefix' && args[i + 1]) {
            result.prefix = args[i + 1];
            i++;
        }
    }

    return result;
}

// Convert to different cases
function toPascalCase(str) {
    return str
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

function toCamelCase(str) {
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

// Main generator function
async function generateModule() {
    const { name, prefix } = parseArgs();

    if (!name || !prefix) {
        console.error('❌ Error: --name and --prefix are required');
        console.log('\nUsage: npm run gen:module -- --name <name> --prefix <prefix>');
        console.log('Example: npm run gen:module -- --name supplier --prefix master');
        process.exit(1);
    }

    const kebabCase = toKebabCase(name);
    const pascalCase = toPascalCase(name);
    const camelCase = toCamelCase(name);

    const templateDir = path.join(__dirname, '..', 'templates');
    const targetDir = path.join(__dirname, '..', 'src', 'modules', prefix, kebabCase);

    // Check if module already exists
    if (fs.existsSync(targetDir)) {
        console.error(`❌ Error: Module "${prefix}/${kebabCase}" already exists`);
        process.exit(1);
    }

    // Create target directory
    fs.mkdirSync(targetDir, { recursive: true });

    const view = {
        pascalCase,
        camelCase,
        kebabCase,
        prefix,
    };

    // Disable Mustache escaping
    Mustache.escape = (text) => text;

    let templates = [];

    if (prefix === 'common') {
        // Common module: service + md only
        templates = [
            { template: 'common.service.ts.mustache', output: `${kebabCase}.service.ts` },
            { template: 'common.md.mustache', output: `${kebabCase}.md` },
        ];
    } else {
        // Business module: full CRUD
        templates = [
            { template: 'module.controller.ts.mustache', output: `${kebabCase}.controller.ts` },
            { template: 'module.service.ts.mustache', output: `${kebabCase}.service.ts` },
            { template: 'module.route.ts.mustache', output: `${kebabCase}.route.ts` },
            { template: 'module.validator.ts.mustache', output: `${kebabCase}.validator.ts` },
            { template: 'module.md.mustache', output: `${kebabCase}.md` },
        ];
    }

    console.log(`\n📦 Generating module: ${prefix}/${kebabCase}`);
    console.log(`   Target: src/modules/${prefix}/${kebabCase}/\n`);

    for (const { template, output } of templates) {
        const templatePath = path.join(templateDir, template);
        const outputPath = path.join(targetDir, output);

        if (!fs.existsSync(templatePath)) {
            console.error(`   ⚠️  Template not found: ${template}`);
            continue;
        }

        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const rendered = Mustache.render(templateContent, view);
        fs.writeFileSync(outputPath, rendered);
        console.log(`   ✅ ${output}`);
    }

    console.log('\n✨ Module generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update prisma/schema.prisma if needed');
    console.log('   2. Register module in src/bootstrap.ts');
    console.log(`   3. Customize generated files in src/modules/${prefix}/${kebabCase}/`);
    console.log(`   4. Update documentation in ${kebabCase}.md`);
    console.log('');
}

generateModule().catch(console.error);
