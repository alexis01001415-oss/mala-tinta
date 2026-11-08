import bpy, math, random, os
from mathutils import Vector, Matrix
from math import sin, cos, pi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'models')
os.makedirs(OUT, exist_ok=True)
random.seed(16)
bpy.ops.wm.read_factory_settings(use_empty=True)
TEX=os.path.join(ROOT,'blender','textures')

def mat(name, color, metallic=0, rough=.5, emission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color,1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = rough
    if emission:
        p.inputs['Emission Color'].default_value = (*color,1)
        p.inputs['Emission Strength'].default_value = emission
    return m

black=mat('Ink black leather',(.019,.021,.022),0,.36)
seam=mat('Leather piping',(.085,.083,.078),0,.47)
metal=mat('Brushed stainless steel',(.44,.47,.48),.84,.25)
chrome=mat('Polished chrome',(.72,.76,.78),.94,.17)
darkmetal=mat('Powder coated iron',(.023,.027,.029),.72,.4)
wall=mat('Charcoal limewash',(.074,.076,.071),0,.95)
oak=mat('Reclaimed stained oak',(.12,.077,.047),0,.75)
wood=[oak]*7
paper=mat('Warm flash paper',(.72,.66,.53),0,.91)
offwhite=mat('Warm ivory',(.8,.79,.7),0,.7)
red=mat('Oxblood lacquer',(.42,.011,.009),.25,.28)
neon=mat('Red neon glass',(.94,.018,.013),0,.22,5)
warm=mat('Warm lamp diffuser',(1,.82,.49),0,.5,3)
gold=mat('Brass contacts',(.55,.31,.09),.82,.26)
green=mat('Soap bottle green',(.12,.3,.18),0,.24)
blue=mat('Blue barrier film',(.09,.19,.23),.05,.45)
rubber=mat('Wheel rubber',(.008,.009,.01),0,.9)
inkcolors=[red,mat('Ink mustard',(.56,.37,.02),0,.48),mat('Ink green',(.02,.16,.08),0,.48),mat('Ink blue',(.024,.08,.26),0,.48),black]

def pbr_texture(material,asset,tint=(1,1,1),scale=1,normal_strength=.6):
    nodes=material.node_tree.nodes;links=material.node_tree.links;p=nodes.get('Principled BSDF')
    material['uv_scale']=scale
    for channel in ['diff','nor_gl','rough']:
        img=bpy.data.images.load(os.path.join(TEX,asset+'_'+channel+'.jpg'),check_existing=True)
        tex=nodes.new('ShaderNodeTexImage');tex.image=img
        if channel=='diff':
            mul=nodes.new('ShaderNodeMix');mul.data_type='RGBA';mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1
            mul.inputs[7].default_value=(*tint,1);links.new(tex.outputs['Color'],mul.inputs[6]);links.new(mul.outputs[2],p.inputs['Base Color'])
        elif channel=='nor_gl':
            img.colorspace_settings.name='Non-Color';normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=normal_strength
            links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],p.inputs['Normal'])
        else:
            img.colorspace_settings.name='Non-Color';links.new(tex.outputs['Color'],p.inputs['Roughness'])

pbr_texture(black,'brown_leather',(.027,.033,.038),.16,.20)
pbr_texture(wall,'plastered_wall_05',(.099,.095,.091),1.7,.76)
pbr_texture(oak,'weathered_brown_planks',(.33,.30,.25),1.6,.52)
flashmat=mat('Original engraved flash illustrations',(.8,.74,.62),0,.93)
tex=flashmat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(os.path.join(TEX,'flash-art.jpg'));flashmat.node_tree.links.new(tex.outputs['Color'],flashmat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
photo_materials=[]
for photo_name in ['blackwork','tradicional','fine-line','realismo']:
    filename=os.path.join(ROOT,'public','images','editorial',photo_name+'.webp')
    m=mat('Printed editorial tattoo photograph | '+photo_name,(.8,.8,.8),0,.65)
    t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(filename)
    m.node_tree.links.new(t.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    photo_materials.append(m)

def project_uv(obj,material):
    if not material or 'uv_scale' not in material:return
    uv=obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap');size=material['uv_scale']
    offset=random.random()*2
    for face in obj.data.polygons:
        axis=max(range(3),key=lambda i:abs(face.normal[i]))
        axes=[i for i in range(3) if i!=axis]
        for li in face.loop_indices:
            co=obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(co[axes[0]]/size+offset,co[axes[1]]/size)

def apply(obj,material,name):
    obj.name=name
    if material:obj.data.materials.append(material)
    return obj

def box(name,loc,scale,material,bevel=.02,rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    apply(o,material,name)
    project_uv(o,material)
    if rot:o.rotation_euler=rot
    if bevel:
        mod=o.modifiers.new('Rounded crafted edges','BEVEL');mod.width=bevel;mod.segments=2
        mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def cyl(name,loc,radius,depth,material,rot=None,vertices=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=bpy.context.object;apply(o,material,name)
    if rot:o.rotation_euler=rot
    for p in o.data.polygons:p.use_smooth=True
    m=o.modifiers.new('Machined edge','BEVEL');m.width=min(radius*.12,.012);m.segments=1
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def sphere(name,loc,scale,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=loc)
    o=bpy.context.object;o.scale=scale;apply(o,material,name)
    for p in o.data.polygons:p.use_smooth=True
    return o

def tube(name,points,radius,material,cyclic=False):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=1
    spl=data.splines.new('POLY');spl.points.add(len(points)-1)
    for p,c in zip(spl.points,points):p.co=(*c,1)
    spl.use_cyclic_u=cyclic;data.bevel_depth=radius;data.bevel_resolution=1
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);apply(o,material,name)
    return o

def rod(name,a,b,r,material):
    a,b=Vector(a),Vector(b)
    o=cyl(name,(a+b)/2,r,(b-a).length,material)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return o

def text_obj(name,body,loc,size,material,rotation=(pi/2,0,0),extrude=.001,font=None):
    d=bpy.data.curves.new(name,'FONT');d.body=body;d.size=size;d.align_x='CENTER';d.resolution_u=3;d.extrude=extrude;d.bevel_depth=.0002 if extrude else 0;d.space_character=1.1
    if font:d.font=font
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rotation;apply(o,material,name)
    return o

# Architecture: human scale, extended foreground to keep the camera inside.
box('Studio foundation',(0,-1.15,-.13),(5.24,6.34,.25),darkmetal,.02)
for j in range(16):
    edges=[-2.5,-1.2,.1,1.4,2.5] if j%2==0 else [-2.5,-2.,-.7,.6,1.9,2.5]
    for start,end in zip(edges,edges[1:]):
        box('Individual reclaimed oak plank',((start+end)/2,j*.394-4.14,.016),(end-start-.009,.387,.07),random.choice(wood),.003)
box('Back wall',(0,1.99,1.46),(5.22,.16,2.92),wall,.012)
box('Left wall',(-2.55,-1.15,1.46),(.15,6.3,2.92),wall,.005)
box('Back baseboard',(0,1.87,.13),(5.05,.08,.18),darkmetal,.005)
box('Left baseboard',(-2.44,-1.15,.13),(.08,6.25,.18),darkmetal,.003)
for x in [-2.3,2.25]:
    rod('Wall conduit',(x,1.88,.16),(x,1.88,2.83),.015,darkmetal)
    box('Outlet housing',(x,1.84,.43),(.12,.06,.17),darkmetal,.014)
    for z in [.4,.46]:box('Outlet slot',(x,1.802,z),(.044,.005,.008),black,.001)

# Modular equipment helpers shared by the furniture and tattoo instruments.
equipment = os.path.join(ROOT, 'blender', 'equipment.py')
exec(compile(open(equipment, encoding='utf-8').read(), equipment, 'exec'))
furniture = os.path.join(ROOT, 'blender', 'furniture.py')
exec(compile(open(furniture, encoding='utf-8').read(), furniture, 'exec'))
cx=.38;cy=-.22
build_chair(cx,cy)

tx,ty=-1.53,.42
tool_cart(tx,ty)
liner(tx-.09,ty-.059,1.242)

# A second pen-style rotary machine laid on a silicone rest.
px=tx+.28;py=ty-.01;pz=1.15
box('Rotary machine silicone rest',(px,py,pz-.024),(.11,.25,.026),rubber,.012)
cyl('Rotary pen anodized body',(px,py,pz+.028),.021,.185,darkmetal,rot=(pi/2,0,0),vertices=48)
cyl('Rotary pen knurled grip',(px,py-.063,pz+.028),.025,.067,black,rot=(pi/2,0,0),vertices=48)
for i in range(12):cyl('Rotary grip grooves',(px,py-.091+i*.005,pz+.028),.0256,.0013,metal,rot=(pi/2,0,0),vertices=32)
cyl('Rotary brass collar',(px,py+.013,pz+.028),.022,.009,gold,rot=(pi/2,0,0))
cyl('Rotary cartridge',(px,py-.117,pz+.028),.008,.039,offwhite,rot=(pi/2,0,0))
box('Rotary OLED screen',(px,py+.049,pz+.049),(.023,.036,.002),black,.003)
text_obj('Rotary OLED voltage','7.5',(px,py+.042,pz+.051),.012,neon,rotation=(0,0,0),extrude=0)

# Artist stool, 5-star chrome caster base and seam detail.
sx=-.72;sy=-1.12
cyl('Artist stool seat',(sx,sy,.73),.31,.15,black,vertices=48)
tube('Stool piping',[(sx+.299*cos(i*2*pi/64),sy+.299*sin(i*2*pi/64),.77) for i in range(64)],.006,seam,True)
cyl('Stool chrome riser',(sx,sy,.43),.045,.49,chrome)
for i in range(5):
    a=i*2*pi/5
    rod('Five star stool base',(sx,sy,.22),(sx+.37*cos(a),sy+.37*sin(a),.14),.03,chrome)
    sphere('Stool rubber caster',(sx+.37*cos(a),sy+.37*sin(a),.09),(.06,.04,.06),rubber)

# Back cabinet, instrument drawers, sanitizing station.
box('Cabinet body',(1.77,1.5,.56),(1.1,.64,.97),darkmetal,.03)
box('Cabinet oak worktop',(1.77,1.48,1.08),(1.19,.73,.07),wood[4],.018)
for z in [.26,.51,.76,.97]:
    box('Drawer face',(1.77,1.165,z),(1.02,.025,.19),wall,.009)
    rod('Drawer chrome handle',(1.55,1.12,z+.02),(1.99,1.12,z+.02),.012,chrome)
bottle('Dispensador de preparación',1.39,1.52,1.12,.038,.226,4,True,.12)
bottle('Pigmento de reserva',1.55,1.65,1.12,.032,.178,0,False,-.17)
bottle('Dilución | etiqueta gris',1.67,1.63,1.12,.030,.16,1,False,.28)

box('Stencil paper stack',(2.06,1.46,1.14),(.34,.4,.04),paper,.004)
box('Sharps container',(2.08,1.69,1.31),(.25,.19,.35),red,.025)
box('Sharps container lid',(2.08,1.69,1.5),(.26,.2,.04),black,.01)

# Connected articulated task lamp, with double arms and a hollow reflector.
build_lamp()

# Flash sheets in layered mismatched frames. Curves are actual mesh in GLB.
def flash_frame(x,z,w,h,variant=0):
    y=1.873
    box('Flash art frame',(x,y,z),(w,.07,h),darkmetal,.013)
    box('Flash art ivory mount',(x,y-.041,z),(w-.065,.008,h-.065),offwhite,.001)
    box('Flash art aged paper',(x,y-.048,z),(w-.13,.004,h-.13),paper,.001)
    yy=y-.054
    fw=w-.15;fh=h-.16
    mesh=bpy.data.meshes.new('Printed flash paper')
    mesh.from_pydata([(x-fw/2,yy,z-fh/2),(x+fw/2,yy,z-fh/2),(x+fw/2,yy,z+fh/2),(x-fw/2,yy,z+fh/2)],[],[(0,1,2,3)])
    o=bpy.data.objects.new('Printed tattoo portrait | '+str(variant),mesh);bpy.context.collection.objects.link(o);apply(o,photo_materials[variant%4],o.name)
    uv=mesh.uv_layers.new(name='UVMap')
    aspect=fw/fh; crop=min(1,.8/aspect); crop_x=min(1,aspect/.8)
    regions=[((1-crop_x)/2,(1-crop)/2,(1+crop_x)/2,(1+crop)/2)]*4
    a,b,c,d=regions[variant%4]
    for i,p in enumerate([(a,b),(c,b),(c,d),(a,d)]):uv.data[i].uv=p
    for xx in [x-w/2+.026,x+w/2-.026]:
        for zz in [z-h/2+.026,z+h/2-.026]:sphere('Frame aged brass pin',(xx,yy-.004,zz),(.003,.002,.003),gold)

for vals in [(-1.8,2.25,.66,.84,0),(-1.04,2.47,.61,.54,2),(-1.02,1.74,.64,.77,3),(-1.89,1.35,.72,.68,1),(-.33,1.55,.48,.62,2),(.77,1.76,.57,.76,0),(1.7,2.37,.69,.66,3),(2.26,1.67,.38,.57,1)]:flash_frame(*vals)

# Neon has backing, porcelain standoffs and real letter extrusion.
box('Neon sign black backing',(.1,1.82,2.5),(1.56,.085,.61),black,.02)
for x in [-.57,.77]:
    for z in [2.26,2.73]:cyl('Neon standoff',(x,1.748,z),.014,.04,metal,rot=(pi/2,0,0))
text_obj('TATTOO neon letters','TATTOO',(.1,1.752,2.42),.285,neon,extrude=.006)
tube('Neon underline',[(-.56,1.74,2.33),(.76,1.74,2.33)],.008,neon)
text_obj('Studio wall mark','MALA TINTA',(.15,1.9,.67),.14,offwhite,extrude=.001)

# Physical pinboard gallery. A curved paper surface and a small binder clip
# catch real light at the edges and turn the final camera stop into a design desk.
box('Flash archive | black wooden picture rail',(-2.445,-.08,1.98),(.04,2.34,.08),enamel,.005)
for n,(yy,zz,w,h,index,tilt) in enumerate([(-.86,1.77,.39,.48,2,-.035),(-.33,1.66,.48,.66,0,.026),(.24,1.72,.48,.57,3,-.018),(.79,1.66,.46,.63,1,.045)]):
    aspect=w/h; crop=min(1,.8/aspect); crop_x=min(1,aspect/.8)
    regions=[((1-crop_x)/2,(1-crop)/2,(1+crop_x)/2,(1+crop)/2)]*4
    left,bottom,right,top=regions[index]
    verts=[];faces=[];coords=[]
    for j in range(5):
        for i in range(5):
            u,v=i/4,j/4
            across=(u-.5)*w;vertical=(v-.5)*h
            verts.append((-2.404+.009*cos(u*pi*2)*sin(v*pi)+.016*((1-v)**3),yy+across*cos(tilt)-vertical*sin(tilt),zz+vertical*cos(tilt)+across*sin(tilt)))
            coords.append((left+u*(right-left),bottom+v*(top-bottom)))
    for j in range(4):
        for i in range(4):
            k=j*5+i;faces.append((k,k+1,k+6,k+5))
    sheet=mesh_object('Archivo | fotografía '+str(n+1),verts,faces,photo_materials[index])
    uv=sheet.data.uv_layers.new(name='UVMap')
    for poly in sheet.data.polygons:
        for li in poly.loop_indices:uv.data[li].uv=coords[sheet.data.loops[li].vertex_index]
    box('Archivo | pinza metálica',(-2.39,yy,zz+h*.48),(.028,.042,.035),metal,.004)
    tube('Archivo | alambre de pinza',[(-2.39,yy-.014,zz+h*.5),(-2.388,yy-.014,zz+h*.5+.037),(-2.388,yy+.014,zz+h*.5+.037),(-2.39,yy+.014,zz+h*.5)],.0018,chrome)
box('Archivo | repisa de dibujo',(-2.23,-.03,.97),(.49,2.22,.042),oak,.009)
for j in range(5):
    o=box('Archivo | pruebas de dibujo',(-2.19,-.16,1.002+j*.002),(.30,.43,.002),paper,.001)
    o.rotation_euler.z=(j-2)*.045
for i in range(4):
    rod('Archivo | lápices de grafito',(-2.23,-.73+i*.013,1.004),(-2.02,-.64+i*.013,1.004),.004,enamel if i%2 else bronze)
text_obj('Archivo de flashes','IDEAS EN PAPEL',(-2.42,-.06,2.11),.104,offwhite,rotation=(pi/2,0,pi/2),extrude=.0003)

# Bench footswitch and coiled power cord.
box('Tattoo footswitch',(-.21,-1.42,.1),(.31,.29,.08),darkmetal,.03)
for i in range(5):box('Footswitch traction',(-.21,-1.51+i*.039,.144),(.22,.01,.005),rubber,.001)
tube('Footswitch cable',[(-.21,-1.3,.09),(-.52,-1.15,.075),(-.9,-.7,.075),(-1.32,-.49,.075),(-1.57,-.13,.075)],.009,rubber)

# Stage a separate preparation station with a pressed metal instrument dish,
# windowed stainless tips, real hemostat loops and crimped paper sleeves.
capsule_tray('Bandeja de instrumental',1.56,1.282,1.126,.49,.165)
for i in range(3):
    tip=steel_tip('Boquilla de acero '+str(i+1),1.425+i*.07,1.285,1.140,.58)
    tip.rotation_euler=(0,pi/2,.10+i*.05)
for i in range(3):
    x,y=1.91,1.30+i*.076
    box('Cartucho | sobre sellado',(x,y,1.131+i*.001),(.26,.065,.006),offwhite,.004)
    box('Cartucho | sello de papel',(x-.105,y,1.135+i*.001),(.021,.058,.001),blue,.001)
    text_obj('Cartucho | código impreso','07 RL  /  MT',(x,y,1.136+i*.001),.013,enamel,rotation=(0,0,0),extrude=0)
cartridge_study(1.75,1.36,1.143)
for i in range(8):
    cyl('Preparación | discos de algodón',(1.27,1.58,1.129+i*.0033),.036,.0033,offwhite,vertices=20)
for i in range(2):
    yy=1.48+i*.035
    rod('Pinza hemostática | vástago',(1.73,yy,1.132),(1.91,1.555-i*.03,1.132),.0024,chrome)
    tube('Pinza hemostática | anilla',[(1.71+.022*cos(k*pi/12),yy+.012*sin(k*pi/12),1.132) for k in range(24)],.0023,chrome,True)
cyl('Pinza | pivote',(1.847,1.518,1.134),.004,.003,bronze)

# Rich context: chair-side adjustable arm pad, sketched paper and wall hardware.
ax=1.12;ay=-1.24
for a in [0,2*pi/3,4*pi/3]:rod('Armrest tripod',(ax,ay,.25),(ax+.31*cos(a),ay+.31*sin(a),.08),.018,darkmetal)
rod('Armrest post',(ax,ay,.16),(ax,ay,1.18),.026,chrome)
cyl('Armrest height lock',(ax+.07,ay,.69),.03,.11,darkmetal,rot=(0,pi/2,0))
box('Adjustable tattoo arm pad',(ax,ay,1.2),(.4,.58,.09),black,.045,rot=(0,.12,-.18))
for i in range(7):
    o=box('Artist loose sketch paper',(-1.25,1.1,1.12+i*.002),(.31,.43,.0016),paper,.001)
    o.rotation_euler.z=(i-3)*.035
# A dim overhead linear light gives the scene an enclosing architectural scale.
box('Ceiling beam',(0,.7,2.91),(5.06,.14,.14),darkmetal,.008)
rod('Pendant cable left',(-.88,.6,2.88),(-.88,.6,2.66),.007,rubber)
rod('Pendant cable right',(.88,.6,2.88),(.88,.6,2.66),.007,rubber)
box('Pendant metal housing',(0,.6,2.65),(1.95,.13,.06),darkmetal,.014)
box('Pendant warm strip',(0,.6,2.615),(1.81,.095,.007),warm,.003)

# Minimal, authored print, no borrowed logos or fictitious certifications.
text_obj('Backroom philosophy','HECHO A MANO.',(.15,1.895,.46),.065,offwhite,extrude=0)
for x in [-2.35,-.6,.6,2.34]:
    cyl('Wall mounting bolt',(x,1.895,.16),.007,.012,metal,rot=(pi/2,0,0),vertices=6)

scene=bpy.context.scene
scene.world=bpy.data.worlds.new('Warm studio environment');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.045,.047,.05,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.22

def area(name,loc,power,color,size,target):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
# A warm practical pools light on the chair. A cool window rakes across the
# counter and picks out the tiny milled steel edges without lifting the blacks.
area('Ventana lateral fría',(-2.1,-1.25,2.8),125,(.66,.79,1),1.55,(-1.25,.60,1.17))
area('Relleno ambiental',(1.8,-2.7,2.0),66,(.82,.87,.98),2.45,(0,.2,1.05))
area('Luz cenital cálida',(0,.50,2.57),152,(1,.72,.48),1.2,(.25,-.38,.8))
area('Reflejo del neón',(.21,1.65,2.44),37,(1,.014,.007),.95,(.4,.4,1.28))
area('Lámpara articulada',(.58,.02,2.04),33,(1,.9,.72),.25,(.35,-.55,.85))
area('Reflejo longitudinal de acero',(-1.30,.55,1.95),29,(.86,.93,1),.48,(-1.60,.36,1.21))
area('Luz de mesa de preparación',(1.85,1.25,2.40),46,(1,.87,.72),.68,(1.58,1.36,1.15))
area('Luz del archivo',(-1.55,-.32,2.32),31,(1,.77,.54),.95,(-2.40,-.15,1.66))
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.16
bpy.ops.object.camera_add(location=(2.55,-3.9,1.76))
cam=bpy.context.object;cam.name='Recorrido del taller';scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='OPTIX';prefs.refresh_devices()
    for device in prefs.devices:device.use=device.type=='OPTIX'
    if any(device.use for device in prefs.devices):scene.cycles.device='GPU'
except Exception as error: print('Cycles CPU fallback',error)
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='WEBP';scene.render.image_settings.quality=85
scene.render.film_transparent=False;scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
# Store the component-level source before joining meshes for the browser.
scene.render.image_settings.color_mode='RGB'
camera_stops=[
    ('studio-poster',(2.55,-3.90,1.76),(-.32,.46,1.30),38),
    ('studio-maquina',(-1.46,-.14,1.439),(-1.62,.36,1.246),27),
    ('studio-ritual',(2.28,.44,1.59),(1.62,1.43,1.21),36),
    ('studio-sillon',(1.92,-2.68,1.57),(.34,-.04,1.20),40),
    ('studio-pieza',(-.82,-.65,1.65),(-2.40,-.06,1.68),35)]
def frame_camera(stop):
    _,location,target,vfov=stop
    cam.location=location
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.lens=36/(2*1.6*math.tan(math.radians(vfov/2)))
frame_camera(camera_stops[0])
# Art-directors can inspect each stop inside Blender using the timeline markers.
for index,stop in enumerate(camera_stops):
    frame_camera(stop)
    keyframe=1+index*48
    cam.keyframe_insert(data_path='location',frame=keyframe)
    cam.keyframe_insert(data_path='rotation_euler',frame=keyframe)
    cam.data.keyframe_insert(data_path='lens',frame=keyframe)
    scene.timeline_markers.new(['Taller','Máquina','Preparación','Sillón','Tu pieza'][index],frame=keyframe)
scene.frame_end=193;scene.frame_set(1)
bpy.ops.file.pack_all()
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','studio.blend'))
# Create a compact web asset: apply bevels then consolidate by material.
bpy.ops.object.select_all(action='DESELECT')
convertible=[o for o in scene.objects if o.type in {'MESH','CURVE','FONT'}]
for o in convertible:o.select_set(True)
if convertible:
    bpy.context.view_layer.objects.active=convertible[0]
    bpy.ops.object.convert(target='MESH')

groups={}
for o in list(bpy.context.scene.objects):
    if o.type=='MESH':groups.setdefault(o.data.materials[0].name if o.data.materials else 'None',[]).append(o)
for key,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();bpy.context.object.name=key+' — studio details'
bpy.ops.object.select_all(action='DESELECT')


# Draco geometry is exported without cameras or lights. Runtime owns both.
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type=='MESH':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'studio.glb'),export_format='GLB',use_selection=True,
    export_yup=True,export_apply=True,export_cameras=False,export_lights=False,export_materials='EXPORT',
    export_image_format='JPEG',export_image_quality=86,export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,export_animations=False)
for index,stop in enumerate(camera_stops):
    scene.frame_set(1+index*48)
    scene.render.filepath=os.path.join(OUT,stop[0]+'.webp')
    bpy.ops.render.render(write_still=True)
print('STUDIO_EXPORT_COMPLETE',os.path.getsize(os.path.join(OUT,'studio.glb')))
