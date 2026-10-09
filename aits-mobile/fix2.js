const fs = require('fs');
const path = require('path');

const mobileSrc = path.join(__dirname, 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (filePath.endsWith('health.tsx')) {
    // Revert the previous manual type addition and replace with imports
    content = content.replace(
      /const renderDiagnosis = \(\{ item \}: \{ item: \{ disease\?: \{ name: string \}; status: string; diagnosedDate: string; notes\?: string \} \}\) =>/g,
      'const renderDiagnosis = ({ item }: { item: import("@/services/health.service").DiagnosisItem }) =>'
    );
    content = content.replace(
      /item\.disease\?\.name \|\| "Unknown Disease"/g,
      'item.condition || "Unknown Condition"'
    );
    content = content.replace(
      /item\.diagnosedDate/g,
      'item.date'
    );

    content = content.replace(
      /const renderVaccination = \(\{ item \}: \{ item: \{ id: string; disease\?: \{ name: string \}; vaccineName\?: string; dose\?: string; administeredDate\?: string; vaccinationDate\?: string; nextDueDate\?: string; status\?: string; administeredBy\?: \{ firstName\?: string; lastName\?: string \} \} \}\) =>/g,
      'const renderVaccination = ({ item }: { item: import("@/services/health.service").VaccinationRecordItem }) =>'
    );
    content = content.replace(
      /item\.disease\?\.name \|\| item\.vaccineName \|\| "General Vaccine"/g,
      'item.vaccine || "General Vaccine"'
    );
    content = content.replace(
      /item\.administeredDate \|\| item\.vaccinationDate/g,
      'item.date'
    );
    content = content.replace(
      /item\.nextDueDate/g,
      'item.nextDue'
    );
    content = content.replace(
      /\{item\.administeredBy\?\.firstName \|\| ""\} \{" "\}\n\s*\{item\.administeredBy\?\.lastName \|\| ""\}/g,
      '{item.vet || ""}'
    );
    // And for the keyExtractor inside FlatList, item is union type.
    content = content.replace(
      /keyExtractor=\{\(item\) => item\.id\}/g,
      'keyExtractor={(item) => (item as import("@/services/health.service").DiagnosisItem).id}'
    );
    content = content.replace(
      /renderItem=\{tab === "DIAGNOSES" \? renderDiagnosis : renderVaccination\}/g,
      'renderItem={(tab === "DIAGNOSES" ? renderDiagnosis : renderVaccination) as any}'
    );
    
    // Wait, let's fix the type of selectedVaccination
    content = content.replace(
      /const \[selectedVaccination, setSelectedVaccination\] = useState<any>\(null\);/g,
      'const [selectedVaccination, setSelectedVaccination] = useState<import("@/services/health.service").VaccinationRecordItem | null>(null);'
    );
    
    content = content.replace(
      /setSelectedVaccination\(item as any\) \/\/ temp fix/g,
      'setSelectedVaccination(item)'
    );

    changed = true;
  }

  if (filePath.endsWith('production.tsx')) {
    content = content.replace(
      /const renderItem = \(\{ item \}: \{ item: \{ id: string; recordDate: string; quantityLiters: number; milkingSession: string; qualityMetrics\?: Record<string, string>; notes\?: string \} \}\) =>/g,
      'const renderItem = ({ item }: { item: import("@/types/production").ProductionRecord }) =>'
    );
    content = content.replace(
      /item\.recordDate/g,
      'item.date'
    );
    content = content.replace(
      /item\.milkingSession/g,
      'item.session'
    );
    content = content.replace(
      /onSubmit=\{async \(data: \{ quantityLiters: number; milkingSession: "MORNING" \| "AFTERNOON" \| "EVENING" \}\) => \{/g,
      'onSubmit={async (data) => {'
    );
    changed = true;
  }

  if (filePath.endsWith('traceability.tsx')) {
    content = content.replace(
      /const renderItem = \(\{ item \}: \{ item: \{ eventType: string; eventDate: string; description\?: string; location\?: string; recordedBy\?: \{ firstName\?: string; lastName\?: string \} \} \}\) =>/g,
      'const renderItem = ({ item }: { item: import("@/types/traceability.types").LifetimeTimelineEvent }) =>'
    );
    content = content.replace(
      /item\.eventType/g,
      'item.category'
    );
    content = content.replace(
      /item\.eventDate/g,
      'item.dateTime'
    );
    content = content.replace(
      /item\.description/g,
      'item.title'
    );
    content = content.replace(
      /item\.location/g,
      'item.farmName'
    );
    content = content.replace(
      /\{item\.recordedBy\?\.firstName \|\| ""\} \{" "\}\n\s*\{item\.recordedBy\?\.lastName \|\| ""\}/g,
      '{item.recordedBy || ""}'
    );
    content = content.replace(
      /item\.recordedBy\?\.firstName/g,
      'item.recordedBy'
    );
    changed = true;
  }

  if (filePath.endsWith('ActionGrid.tsx')) {
    content = content.replace(
      /icon: keyof typeof MaterialCommunityIcons \| keyof typeof Ionicons \| string;/g,
      'icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];'
    );
    content = content.replace(
      /<Ionicons name=\{item\.icon\} size=\{32\} color=\{Colors\.primary\.main\} \/>/g,
      '<Ionicons name={item.icon as React.ComponentProps<typeof Ionicons>["name"]} size={32} color={Colors.primary.main} />'
    );
    changed = true;
  }

  if (filePath.endsWith('index.tsx') && filePath.includes('animals')) {
    content = content.replace(
      /const \{ id \} = useLocalSearchParams<\(.*?\)\?>();/,
      'const { id: rawId } = useLocalSearchParams<{ id: string }>();\n  const id = Array.isArray(rawId) ? rawId[0] : rawId;'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk(mobileSrc);
