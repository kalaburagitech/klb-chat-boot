import Template from '../../models/Template';

export class TemplateEngine {
  /**
   * Compiles a template string by replacing {{variables}} with data.
   */
  static compile(templateContent: string, data: Record<string, string>): string {
    let compiled = templateContent;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      compiled = compiled.replace(regex, value);
    }
    return compiled;
  }

  /**
   * Fetches a template by ID and compiles it with the provided data.
   */
  static async getCompiledTemplate(templateId: string, data: Record<string, string> = {}): Promise<string | null> {
    const template = await Template.findById(templateId);
    if (!template || !template.active) {
      return null;
    }
    
    return this.compile(template.content, data);
  }

  /**
   * Fetches a template by name (for a specific organization) and compiles it.
   */
  static async getCompiledTemplateByName(organizationId: string, name: string, data: Record<string, string> = {}): Promise<string | null> {
    const template = await Template.findOne({ organizationId, name, active: true });
    if (!template) {
      return null;
    }
    
    return this.compile(template.content, data);
  }
}
