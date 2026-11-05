import bpy, math, random, os
from mathutils import Vector
from math import sin, cos, pi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'models')
os.makedirs(OUT, exist_ok=True)
random.seed(16)
bpy.ops.wm.read_factory_settings(use_empty=True)

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
wood=[mat('Aged oak '+str(i),(.115+i*.008,.073+i*.006,.043+i*.004),0,.76) for i in range(7)]
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

def apply(obj,material,name):
    obj.name=name
    if material:obj.data.materials.append(material)
    return obj

def box(name,loc,scale,material,bevel=.02,rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    apply(o,material,name)
    if rot:o.rotation_euler=rot
    if bevel:
        mod=o.modifiers.new('Rounded crafted edges','BEVEL');mod.width=bevel;mod.segments=3
        mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def cyl(name,loc,radius,depth,material,rot=None,vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=bpy.context.object;apply(o,material,name)
    if rot:o.rotation_euler=rot
    for p in o.data.polygons:p.use_smooth=True
    m=o.modifiers.new('Machined edge','BEVEL');m.width=min(radius*.12,.012);m.segments=2
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
    spl.use_cyclic_u=cyclic;data.bevel_depth=radius;data.bevel_resolution=2
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);apply(o,material,name)
    return o

def rod(name,a,b,r,material):
    a,b=Vector(a),Vector(b)
    o=cyl(name,(a+b)/2,r,(b-a).length,material)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return o

def text_obj(name,body,loc,size,material,rotation=(pi/2,0,0),extrude=.001,font=None):
    d=bpy.data.curves.new(name,'FONT');d.body=body;d.size=size;d.align_x='CENTER';d.extrude=extrude;d.bevel_depth=.0005;d.space_character=1.1
    if font:d.font=font
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rotation;apply(o,material,name)
    return o

# Architecture: open front and right, deep stained floor and charcoal plaster.
box('Floating black plinth',(0,0,-.13),(5.24,4.04,.25),darkmetal,.055)
for j in range(10):
    edges=[-2.5,-1.2,.1,1.4,2.5] if j%2==0 else [-2.5,-2.,-.7,.6,1.9,2.5]
    for start,end in zip(edges,edges[1:]):
        box('Individual reclaimed oak plank',((start+end)/2,j*.394-1.78,.016),(end-start-.018,.38,.07),random.choice(wood),.008)
box('Back wall',(0,1.99,1.46),(5.22,.16,2.92),wall,.012)
box('Left wall',(-2.55,.02,1.46),(.15,3.93,2.92),wall,.012)
box('Back baseboard',(0,1.87,.13),(5.05,.08,.18),darkmetal,.005)
box('Left baseboard',(-2.44,.04,.13),(.08,3.8,.18),darkmetal,.005)
for x in [-2.3,2.25]:
    rod('Wall conduit',(x,1.88,.16),(x,1.88,2.83),.015,darkmetal)
    box('Outlet housing',(x,1.84,.43),(.12,.06,.17),darkmetal,.014)
    for z in [.4,.46]:box('Outlet slot',(x,1.802,z),(.044,.005,.008),black,.001)

# Hydraulic tattoo chair, stitched four-part upholstery, adjustable arm rests.
cx=.38;cy=-.22
cyl('Wide circular chair base',(cx,cy,.16),.56,.13,darkmetal,vertices=64)
cyl('Base chrome trim',(cx,cy,.23),.46,.035,chrome,vertices=64)
cyl('Hydraulic pump',(cx,cy,.41),.16,.39,darkmetal)
cyl('Hydraulic chrome piston',(cx,cy,.65),.085,.32,chrome)
box('Seat metal underframe',(cx,cy,.82),(.86,.89,.13),darkmetal,.05)
box('Seat cushion',(cx,cy-.02,.94),(.88,.89,.19),black,.09)
for x in [cx-.36,cx+.36]:tube('Seat stitched seam',[(x,cy-.38,.995),(x,cy+.32,.995)],.004,seam)
angle=-pi/9
box('Reclining back support',(cx,cy+.52,1.35),(.74,.14,1.02),darkmetal,.05,rot=(angle,0,0))
box('Back cushion',(cx,cy+.43,1.42),(.86,.22,1.1),black,.11,rot=(angle,0,0))
box('Adjustable headrest',(cx,cy+.65,2.02),(.58,.23,.31),black,.09,rot=(angle,0,0))
for x in [cx-.32,cx+.32]:
    tube('Backrest stitched piping',[(x,cy+.19,1.05),(x,cy+.46,1.8)],.005,seam)
for z in [1.2,1.5,1.75]:
    for x in [cx-.2,cx+.2]:sphere('Upholstery button',(x,cy+.19+(z-1.05)*.36,z),(.016,.009,.016),seam)
box('Angled leg support',(cx,cy-.74,.7),(.76,.75,.13),darkmetal,.045,rot=(pi/8,0,0))
box('Leg cushion',(cx,cy-.73,.8),(.82,.74,.17),black,.075,rot=(pi/8,0,0))
box('Foot cushion',(cx,cy-1.12,.55),(.78,.29,.14),black,.05,rot=(pi/8,0,0))
for x in [cx-.55,cx+.55]:
    rod('Armrest chrome support',(x,cy+.14,.79),(x,cy+.14,1.22),.027,chrome)
    cyl('Armrest locking knob',(x,cy+.05,1.02),.05,.055,darkmetal,rot=(pi/2,0,0))
    box('Armrest padded leather',(x,cy-.07,1.27),(.22,.72,.14),black,.06)
    for y in [cy-.3,cy+.16]:box('Armrest stitching',(x, y,1.34),(.14,.007,.004),seam,.002)
rod('Foot pedal',(cx-.25,cy-.08,.3),(cx-.45,cy-.57,.2),.024,metal)
box('Hydraulic foot pedal grip',(cx-.46,cy-.6,.2),(.25,.16,.04),rubber,.012)

# Two-shelf stainless trolley, caster hardware, ink bottles and barriers.
tx=-1.53;ty=.42
for z in [.24,.65,1.12]:
    box('Stainless instrument tray',(tx,ty,z),(1.05,.66,.055),metal,.025)
    for xx in [tx-.51,tx+.51]:box('Raised tray lip',(xx,ty,z+.035),(.026,.64,.065),chrome,.01)
    for yy in [ty-.31,ty+.31]:box('Raised tray lip',(tx,yy,z+.035),(1.02,.026,.065),chrome,.01)
for x in [tx-.45,tx+.45]:
    for y in [ty-.26,ty+.26]:
        rod('Trolley polished leg',(x,y,.15),(x,y,1.17),.021,chrome)
        box('Caster fork',(x,y,.14),(.08,.045,.11),metal,.008)
        cyl('Caster rubber wheel',(x,y,.085),.065,.047,rubber,rot=(pi/2,0,0))
tube('Trolley push handle',[(tx-.48,ty+.28,1.15),(tx-.48,ty+.28,1.32),(tx+.48,ty+.28,1.32),(tx+.48,ty+.28,1.15)],.018,chrome)
box('Tray blue barrier',(tx,ty,1.153),(.9,.52,.008),blue,.007)

def bottle(name,x,y,z,r=.04,h=.17,color=black,dropper=True):
    cyl(name+' bottle',(x,y,z+h*.42),r,h*.84,color)
    cyl(name+' paper label',(x,y,z+h*.42),r*1.015,h*.37,offwhite)
    cyl(name+' cap',(x,y,z+h*.89),r*.72,h*.15,black)
    if dropper:
        bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=r*.33,radius2=r*.08,depth=h*.2,location=(x,y,z+h*1.065));apply(bpy.context.object,black,name+' precision nozzle')
    box(name+' label stripe',(x,y-r*1.02,z+h*.42),(r*1.3,.005,h*.07),color,.001)

for i in range(6):bottle('Ink '+str(i),tx-.37+i*.145,ty+.15,1.17,.037,.18,inkcolors[i%5])
for i in range(3):bottle('Reserve ink '+str(i),tx-.3+i*.19,ty-.06,.69,.055,.25,inkcolors[(i+2)%5])
box('Sterile glove box',(tx+.2,ty,.74),(.43,.38,.16),offwhite,.015)
box('Glove box label',(tx+.2,ty-.193,.74),(.34,.005,.06),red,.001)
cyl('Paper towel roll',(tx-.24,ty,.42),.13,.29,offwhite,rot=(0,pi/2,0),vertices=32)
cyl('Paper towel core',(tx-.39,ty,.42),.036,.008,wood[0],rot=(0,pi/2,0))
for i in range(3):
    cyl('Single use ink cap',(tx+.15+i*.1,ty-.16,1.18),.027,.035,offwhite)
    cyl('Black ink in cap',(tx+.15+i*.1,ty-.16,1.199),.02,.003,black)

# Coil tattoo machine with twin copper coils, contact screw and cable.
mx=tx-.25;my=ty-.13;mz=1.19
box('Tattoo machine cast frame',(mx,my,mz+.07),(.25,.09,.14),darkmetal,.02)
for x in [mx-.065,mx+.055]:
    cyl('Machine red coil',(x,my-.057,mz+.082),.045,.11,red,rot=(pi/2,0,0))
    for i in range(9):
        # thin copper wire loops visibly wrapped around each cylinder
        yy=my-.105+i*.011
        tube('Copper coil winding',[(x+.046*cos(a*2*pi/20),yy,mz+.082+.046*sin(a*2*pi/20)) for a in range(20)],.0025,gold,True)
rod('Machine upper spring',(mx-.12,my,mz+.18),(mx+.1,my,mz+.18),.009,chrome)
rod('Brass contact screw',(mx-.07,my,mz+.18),(mx-.07,my,mz+.24),.012,gold)
rod('Needle grip',(mx+.11,my,mz+.08),(mx+.31,my,mz+.08),.038,black)
for i in range(9):cyl('Grip knurled ring',(mx+.12+i*.021,my,mz+.08),.04,.008,metal,rot=(0,pi/2,0))
rod('Steel cartridge',(mx+.31,my,mz+.08),(mx+.42,my,mz+.08),.016,chrome)
rod('Needle tip',(mx+.42,my,mz+.08),(mx+.47,my,mz+.08),.003,chrome)
tube('Machine cord',[(mx-.12,my+.03,mz+.05),(tx-.44,ty-.18,1.18),(tx-.52,ty-.35,.92),(tx-.5,ty-.39,.42),(tx-.25,ty-.4,.11),(tx+.1,ty-.32,.11)],.012,rubber)

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
bottle('Green soap',1.49,1.47,1.12,.075,.3,green,False)
rod('Soap pump stem',(1.49,1.47,1.43),(1.49,1.47,1.49),.018,offwhite)
rod('Soap pump nozzle',(1.49,1.47,1.49),(1.59,1.47,1.49),.014,offwhite)
bottle('Antiseptic',1.74,1.5,1.12,.065,.27,offwhite,False)
box('Stencil paper stack',(2.06,1.46,1.14),(.34,.4,.04),paper,.004)
box('Sharps container',(2.08,1.69,1.31),(.25,.19,.35),red,.025)
box('Sharps container lid',(2.08,1.69,1.5),(.26,.2,.04),black,.01)

# Articulated task lamp and conical enamel shade.
lx=1.45;ly=.3
cyl('Lamp heavy floor foot',(lx,ly,.1),.25,.08,darkmetal,vertices=40)
rod('Lamp vertical post',(lx,ly,.14),(lx,ly,1.37),.022,chrome)
for a,b in [((lx,ly,1.3),(1.15,.28,1.95)),((1.15,.28,1.95),(.65,.1,2.34))]:
    rod('Lamp articulated arm',a,b,.023,darkmetal)
    sphere('Lamp pivot',a,(.055,.055,.055),metal)
    # pair of tension spring rods
    rod('Lamp tension spring',(a[0]+.045,a[1],a[2]+.08),(b[0]+.045,b[1],b[2]-.08),.009,chrome)
rod('Lamp neck',(.65,.1,2.34),(.58,.02,2.25),.025,chrome)
bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.24,radius2=.07,depth=.21,location=(.58,.02,2.16));apply(bpy.context.object,offwhite,'Ivory enamel task lamp')
cyl('Lamp glowing diffuser',(.58,.02,2.052),.22,.008,warm,vertices=48)

# Flash sheets in layered mismatched frames. Curves are actual mesh in GLB.
def flash_frame(x,z,w,h,variant=0):
    y=1.873
    box('Flash art frame',(x,y,z),(w,.07,h),darkmetal,.013)
    box('Flash art ivory mount',(x,y-.041,z),(w-.065,.008,h-.065),offwhite,.001)
    box('Flash art aged paper',(x,y-.048,z),(w-.13,.004,h-.13),paper,.001)
    yy=y-.054;sc=min(w,h)*.33
    def line(name,ps,r=.004,color=black):return tube(name,[(x+a*sc,yy,z+b*sc) for a,b in ps],r,color)
    if variant%4==0:
        # traditional rose, layered organic petal contours and stem
        for j in range(3):
            line('Rose flash petals',[(cos(t*2*pi/72)*(1-j*.23)*(1+.11*sin(t*2*pi/72*5+j)),.2+sin(t*2*pi/72)*(1-j*.23)*.65) for t in range(73)])
        line('Rose stem',[(0,-.3),(-.08,-1.1),(.1,-1.45)])
        line('Rose left leaf',[(-.05,-.75),(-.65,-.6),(-.42,-1),(-.05,-.75)])
        line('Rose right leaf',[(-.03,-.9),(.6,-.64),(.4,-1.15),(-.03,-.9)])
    elif variant%4==1:
        # sacred heart and radiating thorn detail
        pts=[]
        for t in range(100):
            a=t*2*pi/99
            pts.append((sin(a)**3*.85,(13*cos(a)-5*cos(2*a)-2*cos(3*a)-cos(4*a))*.055))
        line('Sacred heart flash',pts,.006,red)
        line('Sacred heart dagger',[(0,-1.38),(0,1.3)])
        line('Dagger cross guard',[(-.4,.75),(.4,.75)])
        for i in range(8):
            a=i*2*pi/8;line('Heart radiance',[(1.05*cos(a),1.05*sin(a)),(1.23*cos(a),1.23*sin(a))],.003)
    elif variant%4==2:
        # crescent and orbit, tiny stars
        line('Crescent flash',[(.75*cos(t*pi/40)+.1,.95*sin(t*pi/40)) for t in range(-30,31)])
        line('Crescent inner',[(.56*cos(t*pi/40)+.29,.85*sin(t*pi/40)) for t in range(-28,29)])
        for a,b in [(-.75,.7),(.1,-1.1),(-.6,-.7)]:
            line('Flash star',[(a-.13,b),(a+.13,b)])
            line('Flash star',[(a,b-.13),(a,b+.13)])
    else:
        # serpentine body, repeated scale ticks
        pts=[(.65*sin(t*3*pi/45),-1.15+t*2.1/45) for t in range(46)]
        line('Snake flash outline left',[(a-.08,b) for a,b in pts],.005)
        line('Snake flash outline right',[(a+.08,b) for a,b in pts],.005)
        for i in range(0,44,3):
            a,b=pts[i];line('Snake scale',[(a-.07,b),(a+.07,b+.05)],.002)
        a,b=pts[-1];line('Snake head',[(a-.08,b),(a-.15,b+.15),(a,b+.26),(a+.15,b+.15),(a+.08,b)])
    # catalog caption as fine horizontal marks
    for i,ww in enumerate([.48,.66]):box('Flash caption line',(x,yy-.001,z-h*.39+i*.025),(w*ww,.003,.006),black,.001)

for vals in [(-1.8,2.25,.66,.84,0),(-1.04,2.47,.61,.54,2),(-1.02,1.74,.64,.77,3),(-1.89,1.35,.72,.68,1),(-.33,1.55,.48,.62,2),(.77,1.76,.57,.76,0),(1.7,2.37,.69,.66,3),(2.26,1.67,.38,.57,1)]:flash_frame(*vals)

# Neon has backing, porcelain standoffs and real letter extrusion.
box('Neon sign black backing',(.1,1.82,2.5),(1.56,.085,.61),black,.02)
for x in [-.57,.77]:
    for z in [2.26,2.73]:cyl('Neon standoff',(x,1.748,z),.014,.04,metal,rot=(pi/2,0,0))
text_obj('TATTOO neon letters','TATTOO',(.1,1.752,2.42),.285,neon,extrude=.006)
tube('Neon underline',[(-.56,1.74,2.33),(.76,1.74,2.33)],.008,neon)
text_obj('Studio wall mark','MALA TINTA',(.15,1.9,.67),.14,offwhite,extrude=.001)

# Left wall bookshelf provides depth when camera moves.
for z in [1.42,2.22]:
    box('Left shelf',(-2.24,.82,z),(.48,1.9,.055),wood[2],.014)
    for i in range(7):
        yy=.08+i*.23
        box('Sketchbook spine',(-2.21,yy,z+.19),(.32,.13,.32+random.random()*.08),[red,black,paper,wall][i%4],.006)
        box('Sketchbook spine bands',(-2.041,yy,z+.23),(.005,.10,.017),gold,.001)

# Bench footswitch and coiled power cord.
box('Tattoo footswitch',(-.21,-1.42,.1),(.31,.29,.08),darkmetal,.03)
for i in range(5):box('Footswitch traction',(-.21,-1.51+i*.039,.144),(.22,.01,.005),rubber,.001)
tube('Footswitch cable',[(-.21,-1.3,.09),(-.52,-1.15,.075),(-.9,-.7,.075),(-1.32,-.49,.075),(-1.57,-.13,.075)],.009,rubber)

# Create a compact web asset: apply bevels then consolidate by material.
for o in list(bpy.context.scene.objects):
    if o.type in {'CURVE','FONT'}:
        bpy.context.view_layer.objects.active=o;o.select_set(True)
        bpy.ops.object.convert(target='MESH');o.select_set(False)
    elif o.type=='MESH':
        bpy.context.view_layer.objects.active=o
        for modifier in list(o.modifiers):
            try:bpy.ops.object.modifier_apply(modifier=modifier.name)
            except:pass

groups={}
for o in list(bpy.context.scene.objects):
    if o.type=='MESH':groups.setdefault(o.data.materials[0].name if o.data.materials else 'None',[]).append(o)
for key,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();bpy.context.object.name=key+' — studio details'
bpy.ops.object.select_all(action='DESELECT')

scene=bpy.context.scene
scene.world=bpy.data.worlds.new('Warm studio environment');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.105,.1,.085,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4

def area(name,loc,power,color,size,target):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Large warm key',(2,-3,6),1500,(1,.83,.64),5,(0,0,1))
area('Cool edge fill',(-3,-2,3.8),900,(.66,.76,1),4,(0,0,1.2))
area('Red neon bounce',(.1,1.2,2.5),65,(1,.02,.015),1.5,(0,0,1))
area('Task lamp pool',(.58,.02,2.02),70,(1,.83,.55),.4,(.3,-.1,.9))
bpy.ops.object.camera_add(location=(7.2,-8.8,6.1))
cam=bpy.context.object;cam.name='Studio editorial camera';cam.rotation_euler=(Vector((0,.0,1.2))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=7.6;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1440;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.view_settings.view_transform='AgX'

# Export just meshes; runtime owns lighting/camera and honors reduced-motion.
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type=='MESH':o.select_set(True)
export_args=dict(filepath=os.path.join(OUT,'studio.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_cameras=False,export_lights=False,export_materials='EXPORT')
try:
    bpy.ops.export_scene.gltf(**export_args,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
except Exception as error:
    print('DRACO_EXPORT_FALLBACK',error)
    bpy.ops.export_scene.gltf(**export_args)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','studio.blend'))
scene.render.filepath=os.path.join(ROOT,'blender','studio-poster.png')
bpy.ops.render.render(write_still=True)
print('STUDIO_EXPORT_COMPLETE',os.path.getsize(os.path.join(OUT,'studio.glb')))
