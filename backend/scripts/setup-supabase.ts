import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
};

async function main() {
    console.log('🚀 Supabase Setup Wizard');
    console.log('--------------------------------');

    const currentDir = path.basename(path.resolve(__dirname, '../../'));
    const projectName = await question(`Project Name (default: ${currentDir}): `) || currentDir;
    const basePortStr = await question('Base Port (default: 54320): ') || '54320';
    const basePort = parseInt(basePortStr, 10);

    const ports = {
        api: basePort + 1,
        db: basePort + 2,
        studio: basePort + 3,
        inbucket: basePort + 4,
        analytics: basePort + 7,
        pooler: basePort + 9,
        shadow: basePort,
    };

    console.log('\nConfiguration:');
    console.log(`Project Name: ${projectName}`);
    console.log(`Ports: API=${ports.api}, DB=${ports.db}, Studio=${ports.studio}`);

    const confirm = await question('\nApply changes? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
        console.log('Aborted.');
        rl.close();
        return;
    }

    // 1. Update config.toml
    const configPath = path.join(__dirname, '../supabase/config.toml');
    let configContent = fs.readFileSync(configPath, 'utf8');

    // Regex replacements
    configContent = configContent.replace(/project_id = ".*"/, `project_id = "${projectName}"`);
    configContent = configContent.replace(/port = \d+/g, (match) => {
        // This is a bit risky if we don't know context, but let's try to be specific
        return match; // Placeholder, better to replace specific sections
    });

    // Better approach: Replace specific keys
    // We need to be careful not to break the file structure.
    // Let's use string replacement for known keys.

    const replacements = [
        { key: 'project_id', val: `"${projectName}"` },
        { section: '[api]', key: 'port', val: ports.api },
        { section: '[db]', key: 'port', val: ports.db },
        { section: '[db]', key: 'shadow_port', val: ports.shadow },
        { section: '[db.pooler]', key: 'port', val: ports.pooler },
        { section: '[studio]', key: 'port', val: ports.studio },
        { section: '[inbucket]', key: 'port', val: ports.inbucket },
        { section: '[analytics]', key: 'port', val: ports.analytics },
    ];

    const lines = configContent.split('\n');
    let currentSection = '';
    const newLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            currentSection = trimmed;
        }

        if (line.includes('=')) {
            const [key] = line.split('=').map(s => s.trim());

            // Global project_id
            if (key === 'project_id' && currentSection === '') {
                return `project_id = "${projectName}"`;
            }

            // Section specific ports
            const replacement = replacements.find(r =>
                (r.section === currentSection || (!r.section && currentSection === '')) &&
                r.key === key
            );

            if (replacement) {
                return `${key} = ${replacement.val}`;
            }
        }
        return line;
    });

    fs.writeFileSync(configPath, newLines.join('\n'));
    console.log('✅ Updated supabase/config.toml');

    // 2. Update .env files
    const backendEnvPath = path.join(__dirname, '../.env');
    const frontendEnvPath = path.join(__dirname, '../../frontend/.env');

    const updateEnv = (filePath: string, apiUrl: string) => {
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            // Update SUPABASE_URL
            // This assumes standard format
            if (content.includes('SUPABASE_URL=')) {
                content = content.replace(/SUPABASE_URL=.*/, `SUPABASE_URL=${apiUrl}`);
            } else if (content.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
                content = content.replace(/NEXT_PUBLIC_SUPABASE_URL=.*/, `NEXT_PUBLIC_SUPABASE_URL=${apiUrl}`);
            }
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated ${path.basename(filePath)}`);
        } else {
            console.log(`⚠️  ${path.basename(filePath)} not found, skipping.`);
        }
    };

    const apiUrl = `http://127.0.0.1:${ports.api}`;
    updateEnv(backendEnvPath, apiUrl);
    updateEnv(frontendEnvPath, apiUrl);

    console.log('\n🎉 Setup complete! You can now run:');
    console.log('   npm run start:dev');
    rl.close();
}

main().catch(console.error);
