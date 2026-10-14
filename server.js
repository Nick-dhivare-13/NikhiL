require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes, QueryTypes } = require('sequelize');

const app = express();
const sequelize = new Sequelize(process.env.DB_NAME || 'solarsphere', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306), dialect: 'mysql', logging: false
});
const User = sequelize.define('User', { name: DataTypes.STRING, email: { type: DataTypes.STRING, unique: true }, phone: DataTypes.STRING, password_hash: DataTypes.STRING, role: DataTypes.STRING }, { tableName: 'users', timestamps: false });
const Company = sequelize.define('Company', { name: DataTypes.STRING, description: DataTypes.TEXT, is_fictional: DataTypes.BOOLEAN, active: DataTypes.BOOLEAN }, { tableName: 'companies', timestamps: false });
const Package = sequelize.define('Package', { company_id: DataTypes.INTEGER, name: DataTypes.STRING, capacity_kw: DataTypes.DECIMAL, price_inr: DataTypes.DECIMAL, warranty_years: DataTypes.INTEGER, subsidy_inr: DataTypes.DECIMAL, subsidy_note: DataTypes.STRING, details: DataTypes.TEXT, active: DataTypes.BOOLEAN }, { tableName: 'packages', timestamps: false });
const Enquiry = sequelize.define('Enquiry', { reference_code: DataTypes.STRING, user_id: DataTypes.INTEGER, package_id: DataTypes.INTEGER, company_name_snapshot: DataTypes.STRING, package_name_snapshot: DataTypes.STRING, price_snapshot: DataTypes.DECIMAL, monthly_bill: DataTypes.DECIMAL, roof_area_sqft: DataTypes.DECIMAL, pincode: DataTypes.STRING, address: DataTypes.STRING, status: DataTypes.STRING, created_at: DataTypes.DATE }, { tableName: 'enquiries', timestamps: false });
Company.hasMany(Package, { foreignKey: 'company_id' }); Package.belongsTo(Company, { foreignKey: 'company_id' });
app.use(express.json({ limit: '50kb' }));
const sessionStore = new SequelizeStore({ db: sequelize });
app.use(session({ secret: process.env.SESSION_SECRET || 'local-only-change-me-before-use', resave: false, saveUninitialized: false, store: sessionStore, cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 8 * 60 * 60 * 1000 } }));
// Serve the current KVL website from this project folder while keeping server
// files, SQL, environment files, and node_modules out of the public web root.
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
for (const file of ['styles.css', 'site-config.js', 'script.js', 'lusi.js', 'promo-video.js', 'emi.js', 'tracking.js']) {
  app.get('/' + file, (_req, res) => res.sendFile(path.join(__dirname, file)));
}
for (const page of ['auth.html', 'offers.html', 'quotes.html', 'admin.html']) {
  app.get('/' + page, (_req, res) => res.sendFile(path.join(__dirname, page)));
}
for (const file of ['app.js', 'portal.css']) {
  app.get('/' + file, (_req, res) => res.sendFile(path.join(__dirname, file)));
}
app.get('/emi.html', (_req, res) => res.sendFile(path.join(__dirname, 'emi.html')));
app.get('/tracking.html', (_req, res) => res.sendFile(path.join(__dirname, 'tracking.html')));
const fail = (res, status, message) => res.status(status).json({ error: message });
const signedIn = (req, res, next) => req.session.user ? next() : fail(res, 401, 'Please sign in first.');
const adminOnly = (req, res, next) => req.session.user?.role === 'admin' ? next() : fail(res, 403, 'Admin access required.');
const safeUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });

app.get('/api/me', (req,res) => res.json({ user: req.session.user || null }));
app.post('/api/auth/register', async (req,res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || !/^[6-9]\d{9}$/.test(phone || '') || typeof password !== 'string' || password.length < 8) return fail(res,400,'Enter your name, valid email, 10-digit Indian mobile, and password (at least 8 characters).');
  try { const user = await User.create({ name:name.trim(), email:email.trim().toLowerCase(), phone, password_hash:await bcrypt.hash(password,12), role:'customer' }); req.session.user=safeUser(user); res.status(201).json({ user:req.session.user }); }
  catch(e) { if(e.name==='SequelizeUniqueConstraintError') return fail(res,409,'An account with that email already exists.'); console.error(e); return fail(res,500,'Could not create account.'); }
});
app.post('/api/auth/login', async (req,res) => {
  const user=await User.findOne({where:{email:String(req.body?.email||'').trim().toLowerCase()}});
  if(!user || !(await bcrypt.compare(String(req.body?.password||''),user.password_hash))) return fail(res,401,'Email or password is incorrect.');
  req.session.user=safeUser(user); res.json({user:req.session.user});
});
app.post('/api/auth/logout',(req,res)=>req.session.destroy(()=>{res.clearCookie('connect.sid');res.json({ok:true});}));
app.get('/api/catalog',signedIn,async(req,res)=>{
  const rows=await Package.findAll({where:{active:true},include:[{model:Company,where:{active:true}}],order:[['capacity_kw','ASC']]});
  res.json({packages:rows.map(p=>({id:p.id,name:p.name,capacityKw:Number(p.capacity_kw),price:Number(p.price_inr),warrantyYears:p.warranty_years,subsidy:Number(p.subsidy_inr),subsidyNote:p.subsidy_note,details:p.details,company:p.Company.name,fictional:true}))});
});
app.get('/api/settings',async(req,res)=>{const [s]=await sequelize.query('SELECT system_price_inr AS systemPrice, down_payment_inr AS downPayment, annual_interest_percent AS annualInterestPercent, default_loan_years AS defaultLoanYears FROM app_settings WHERE id=1',{type:QueryTypes.SELECT});res.json(s||{systemPrice:187500,downPayment:37500,annualInterestPercent:9.5,defaultLoanYears:5});});
app.post('/api/enquiries',signedIn,async(req,res)=>{
  const {packageId,monthlyBill,roofArea,pincode,address}=req.body||{};
  if(!Number.isInteger(Number(packageId))||!Number.isFinite(+monthlyBill)||+monthlyBill<=0||!Number.isFinite(+roofArea)||+roofArea<=0||! /^[1-9]\d{5}$/.test(pincode||'')||!address?.trim()) return fail(res,400,'Complete all fields with a valid bill, roof area, Indian pincode, and address.');
  const pkg=await Package.findOne({where:{id:Number(packageId),active:true},include:[Company]}); if(!pkg||!pkg.Company.active) return fail(res,404,'That sample package is no longer available.');
  const ref='SS-'+new Date().getFullYear()+'-'+crypto.randomBytes(3).toString('hex').toUpperCase();
  const item=await Enquiry.create({reference_code:ref,user_id:req.session.user.id,package_id:pkg.id,company_name_snapshot:pkg.Company.name,package_name_snapshot:pkg.name,price_snapshot:pkg.price_inr,monthly_bill:+monthlyBill,roof_area_sqft:+roofArea,pincode,address:address.trim(),status:'Received',created_at:new Date()});
  res.status(201).json({referenceCode:item.reference_code});
});
app.get('/api/enquiries/mine',signedIn,async(req,res)=>{const rows=await Enquiry.findAll({where:{user_id:req.session.user.id},order:[['created_at','DESC']]});res.json({enquiries:rows});});
app.get('/api/enquiries/track/:reference',signedIn,async(req,res)=>{const row=await Enquiry.findOne({where:{reference_code:String(req.params.reference).toUpperCase(),user_id:req.session.user.id}});if(!row)return fail(res,404,'No saved request with that reference belongs to this account.');res.json({enquiry:row});});
app.get('/api/admin/companies',signedIn,adminOnly,async(req,res)=>{const rows=await Company.findAll({include:[Package],order:[['id','ASC']]});res.json({companies:rows});});
app.get('/api/admin/customers',signedIn,adminOnly,async(req,res)=>{const rows=await User.findAll({where:{role:'customer'},attributes:['id','name','email','phone','created_at'],order:[['created_at','DESC']]});res.json({customers:rows});});
app.put('/api/admin/packages/:id',signedIn,adminOnly,async(req,res)=>{const p=await Package.findByPk(req.params.id);if(!p)return fail(res,404,'Package not found.');const b=req.body||{};if(!b.name?.trim()||!Number.isFinite(+b.capacityKw)||+b.capacityKw<=0||!Number.isFinite(+b.price)||+b.price<=0||!Number.isFinite(+b.subsidy)||+b.subsidy<0)return fail(res,400,'Check package name, capacity, price, and subsidy.');await p.update({name:b.name.trim(),capacity_kw:+b.capacityKw,price_inr:+b.price,subsidy_inr:+b.subsidy,warranty_years:Math.max(0,Math.floor(+b.warrantyYears||0)),subsidy_note:String(b.subsidyNote||'Fictional sample only; not a real subsidy.').slice(0,255),details:String(b.details||'').slice(0,2000),active:b.active!==false});res.json({ok:true});});
app.put('/api/admin/companies/:id',signedIn,adminOnly,async(req,res)=>{const c=await Company.findByPk(req.params.id);if(!c)return fail(res,404,'Company not found.');const {name,description,active}=req.body||{};if(!name?.trim())return fail(res,400,'Company name is required.');await c.update({name:name.trim(),description:String(description||'').slice(0,4000),active:active!==false});res.json({ok:true});});
app.put('/api/admin/settings',signedIn,adminOnly,async(req,res)=>{const price=+req.body?.systemPrice,down=+req.body?.downPayment,rate=+req.body?.annualInterestPercent,years=+req.body?.defaultLoanYears;if(!Number.isFinite(price)||price<=0||price>100000000||!Number.isFinite(down)||down<0||down>=price||!Number.isFinite(rate)||rate<0||rate>40||!Number.isInteger(years)||years<1||years>30)return fail(res,400,'Enter a valid system price, a smaller down payment, interest from 0–40%, and term from 1–30 years.');await sequelize.query('UPDATE app_settings SET system_price_inr=?, down_payment_inr=?, annual_interest_percent=?, default_loan_years=? WHERE id=1',{replacements:[price,down,rate,years]});res.json({ok:true});});
app.get('/api/admin/enquiries',signedIn,adminOnly,async(req,res)=>{const rows=await sequelize.query('SELECT e.*,u.name AS customer_name,u.email,u.phone FROM enquiries e JOIN users u ON u.id=e.user_id ORDER BY e.created_at DESC',{type:QueryTypes.SELECT});res.json({enquiries:rows});});
app.put('/api/admin/enquiries/:id/status',signedIn,adminOnly,async(req,res)=>{const allowed=['Received','Reviewing','Site visit planned','Estimate prepared','Closed'];const {status,note=''}=req.body||{};if(!allowed.includes(status))return fail(res,400,'Choose a valid enquiry status.');const e=await Enquiry.findByPk(req.params.id);if(!e)return fail(res,404,'Enquiry not found.');await sequelize.transaction(async t=>{await e.update({status},{transaction:t});await sequelize.query('INSERT INTO enquiry_status_history (enquiry_id,status,note,changed_by) VALUES (?,?,?,?)',{replacements:[e.id,status,String(note).slice(0,255),req.session.user.id],transaction:t});});res.json({ok:true});});
app.get('/api/admin/summary',signedIn,adminOnly,async(req,res)=>{const [r]=await sequelize.query('SELECT (SELECT COUNT(*) FROM users WHERE role=\'customer\') AS customers,(SELECT COUNT(*) FROM enquiries) AS enquiries',( {type:QueryTypes.SELECT}));res.json(r);});
app.get('/api/health',async(_req,res)=>{try{await sequelize.authenticate();res.json({ok:true,database:'connected'});}catch(_){res.status(503).json({ok:false,database:'unavailable'});}});
const port=Number(process.env.PORT||3000);
sequelize.authenticate().then(async()=>{
  const [columns]=await sequelize.query('SHOW COLUMNS FROM app_settings');
  if(!columns.some(column=>column.Field==='system_price_inr')) await sequelize.query('ALTER TABLE app_settings ADD COLUMN system_price_inr DECIMAL(12,2) NOT NULL DEFAULT 187500');
  if(!columns.some(column=>column.Field==='down_payment_inr')) await sequelize.query('ALTER TABLE app_settings ADD COLUMN down_payment_inr DECIMAL(12,2) NOT NULL DEFAULT 37500');
  await sessionStore.sync();
}).then(()=>{console.log('MySQL connected');app.listen(port,()=>console.log(`SolarSphere running at http://localhost:${port}`));}).catch(err=>{console.error('MySQL connection failed:',err.message);console.error('Start MySQL, import database/schema.sql, and check the project .env settings.');process.exit(1);});
