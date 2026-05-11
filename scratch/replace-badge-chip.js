const fs = require('fs');
const path = require('path');

const componentsPath = path.join(__dirname, '../mobile/client/components/components');
const chipPath = path.join(__dirname, '../mobile/client/components/ui/Chip/index.tsx');

const chipCode = `import React from 'react';
import { Chip as HeroChip } from 'heroui-native';
import { Text } from 'react-native';

export const Chip = ({ children, className, style, ...props }: any) => {
  let iconProps: any = {};
  let textContent: any = null;
  let hasSpecialChildren = false;

  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      if (child.type === ChipIcon) {
        iconProps = child.props;
        hasSpecialChildren = true;
      }
      if (child.type === ChipText) {
        textContent = child.props.children;
        hasSpecialChildren = true;
      }
    }
  });

  const IconComponent = iconProps.as;
  const startContent = IconComponent ? <IconComponent {...iconProps} size={16} color="white" /> : undefined;

  return (
    <HeroChip className={className} style={style} startContent={startContent} {...props}>
      <Text style={{ color: 'white', fontWeight: 'bold' }}>{hasSpecialChildren ? textContent : children}</Text>
    </HeroChip>
  );
};

export const ChipText: React.FC<any> = () => null;
export const ChipIcon: React.FC<any> = () => null;
`;

fs.writeFileSync(chipPath, chipCode);

function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walkSync(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

walkSync(componentsPath, filepath => {
  if (filepath.endsWith('.tsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (content.includes('components/ui/badge')) {
      content = content.replace(/import\s+{\s*Badge\s*,\s*BadgeText\s*}\s*from\s*['"]@\/components\/ui\/badge['"];?/g, "import { Chip, ChipText } from '@/components/ui/Chip';");
      content = content.replace(/import\s+{\s*Badge\s*,\s*BadgeIcon\s*,\s*BadgeText\s*}\s*from\s*['"]@\/components\/ui\/badge['"];?/g, "import { Chip, ChipIcon, ChipText } from '@/components/ui/Chip';");
      
      content = content.replace(/<Badge/g, '<Chip');
      content = content.replace(/<\/Badge>/g, '</Chip>');
      content = content.replace(/<BadgeText/g, '<ChipText');
      content = content.replace(/<\/BadgeText>/g, '</ChipText>');
      content = content.replace(/<BadgeIcon/g, '<ChipIcon');
      content = content.replace(/<\/BadgeIcon>/g, '</ChipIcon>');
      
      fs.writeFileSync(filepath, content);
    }
  }
});
console.log('Badge replaced with Chip!');
