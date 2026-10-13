const fs = require('fs');
const path = require('path');

// 1. Update Models
const modelsDir = path.join(__dirname, 'models');
const models = fs.readdirSync(modelsDir);

for (const model of models) {
  if (model === 'Tenant.js') continue;
  let content = fs.readFileSync(path.join(modelsDir, model), 'utf8');
  
  if (!content.includes('entityId: {')) {
    // There are two common patterns from grep:
    // Pattern 1: `  timestamps: true,`
    // Pattern 2: `}, { timestamps: true });`
    
    // Let's replace the end of the schema definition right before `timestamps: true`
    if (content.includes('timestamps: true,')) {
      content = content.replace(
        /timestamps: true,/g,
        "entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },\n  timestamps: true,"
      );
    } else if (content.includes('}, { timestamps: true });')) {
      content = content.replace(
        /}, { timestamps: true }\);/g,
        "  entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }\n}, { timestamps: true });"
      );
    }
    
    fs.writeFileSync(path.join(modelsDir, model), content);
    console.log(`Updated model: ${model}`);
  }
}

// 2. Update Routes
const routesDir = path.join(__dirname, 'routes');
const routes = fs.readdirSync(routesDir);

for (const route of routes) {
  if (route === 'pragatiRoutes.js' || route === 'authRoutes.js') continue;
  let content = fs.readFileSync(path.join(routesDir, route), 'utf8');
  
  // POST req.body.entityId
  content = content.replace(
    /const (\w+) = new (\w+)\(req.body\);/g,
    "req.body.entityId = req.entityId;\n    const $1 = new $2(req.body);"
  );
  
  // GET query = {} -> query = { entityId: req.entityId }
  content = content.replace(
    /const query = {};/g,
    "const query = { entityId: req.entityId };"
  );
  
  // countDocuments() -> countDocuments({ entityId: req.entityId })
  content = content.replace(
    /countDocuments\(\)/g,
    "countDocuments({ entityId: req.entityId })"
  );
  
  // countDocuments({ status: 'Active' }) -> countDocuments({ status: 'Active', entityId: req.entityId })
  content = content.replace(
    /countDocuments\(\{ (.*?) \}\)/g,
    "countDocuments({ $1, entityId: req.entityId })"
  );
  
  // findById(req.params.id) -> findOne({ _id: req.params.id, entityId: req.entityId })
  content = content.replace(
    /findById\(req\.params\.id\)/g,
    "findOne({ _id: req.params.id, entityId: req.entityId })"
  );
  
  // findByIdAndUpdate(req.params.id, req.body -> findOneAndUpdate({ _id: req.params.id, entityId: req.entityId }, req.body
  content = content.replace(
    /findByIdAndUpdate\(\s*req\.params\.id,/g,
    "findOneAndUpdate(\n      { _id: req.params.id, entityId: req.entityId },"
  );
  
  // findByIdAndDelete(req.params.id) -> findOneAndDelete({ _id: req.params.id, entityId: req.entityId })
  content = content.replace(
    /findByIdAndDelete\(req\.params\.id\)/g,
    "findOneAndDelete({ _id: req.params.id, entityId: req.entityId })"
  );

  // For dashboard routes which use aggregates
  // aggregate([ -> aggregate([ { $match: { entityId: req.entityId } }, 
  content = content.replace(
    /aggregate\(\[\s*/g,
    "aggregate([\n      { $match: { entityId: req.entityId } },\n      "
  );
  
  fs.writeFileSync(path.join(routesDir, route), content);
  console.log(`Updated route: ${route}`);
}

console.log("Migration complete.");
