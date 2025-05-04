#version 460 

#define EPSILON 0.001
#define BIG 1000000.0
#define STACK_SIZE 256
#define MAX_DEPTH 10

const int DIFFUSE = 1;
const int REFLECTION = 2;
const int REFRACTION = 3;
const int DIFFUSE_REFLECTION = 1;
const int MIRROR_REFLECTION = 2;


/*** DATA STRUCTURES ***/
struct SCamera
{
	vec3 Position;
	vec3 View;
	vec3 Up;
	vec3 Side;
	vec2 Scale;
};

struct SRay
{
	vec3 Origin;
	vec3 Direction;
};

struct SSphere
{
	vec3 Center;
	float Radius;
	int MaterialIdx;
};

struct STriangle
{
	vec3 v1;
	vec3 v2;
	vec3 v3;
	int MaterialIdx;
};

struct SIntersection
{
	float Time;
	vec3 Point;
	vec3 Normal;
	vec3 Color;
	// ambient, diffuse and specular coeffs
	vec4 LightCoeffs;
	// 0 - non-reflection, 1 - mirror
	float ReflectionCoef;
	float RefractionCoef;
	int MaterialType;
};

struct SLight
{
 vec3 Position;
};

struct SMaterial
{
	//diffuse color
	vec3 Color;
	// ambient, diffuse and specular coeffs
	vec4 LightCoeffs;
	// 0 - non-reflection, 1 - mirror
	float ReflectionCoef;
	float RefractionCoef;
	int MaterialType;
};

struct STracingRay
{
	SRay ray;
	float contribution;
	int depth;
};

struct SStack 
{
	int top;
	STracingRay container[STACK_SIZE];
};

STriangle triangles[10];
SSphere spheres[3];
SCamera uCamera;
SStack stack;

SLight uLight;
SMaterial materials[6];
float Unit = 1;

out vec4 FragColor; 
in vec3 glPosition; 

void initializeDefaultLightMaterials()
{
	//** LIGHT **//
	uLight.Position = vec3(2.0, -4.0, -5.0f);
	/** MATERIALS **/
	vec4 lightCoefs = vec4(0.4,0.9,0.0,512.0);
	
	materials[0].Color = vec3(21.0 / 255.0, 74.0 / 255.0, 95.0 / 255.0);
	materials[0].LightCoeffs = vec4(lightCoefs);
	materials[0].ReflectionCoef = 0.5;
	materials[0].RefractionCoef = 1.0;
	materials[0].MaterialType = DIFFUSE_REFLECTION;

	materials[1].Color = vec3(0.0, 0.0, 1.0);
	materials[1].LightCoeffs = vec4(lightCoefs);
	materials[1].ReflectionCoef = 0.5;
	materials[1].RefractionCoef = 1.0;
	materials[1].MaterialType = MIRROR_REFLECTION;
	
	materials[2].Color = vec3(21.0 / 255.0, 74.0 / 255.0, 95.0 / 255.0);
	materials[2].LightCoeffs = vec4(lightCoefs);
	materials[2].ReflectionCoef = 0.5;
	materials[2].RefractionCoef = 1.0;
	materials[2].MaterialType = DIFFUSE_REFLECTION;

	materials[3].Color = vec3(167.0 / 255.0, 166.0 / 255.0, 86.0 / 255.0);
	materials[3].LightCoeffs = vec4(lightCoefs);
	materials[3].ReflectionCoef = 0.5;
	materials[3].RefractionCoef = 1.0;
	materials[3].MaterialType = DIFFUSE_REFLECTION;

	materials[4].Color = vec3(0.7, 0.1, 0.3);
	materials[4].LightCoeffs = vec4(lightCoefs);
	materials[4].ReflectionCoef = 0.5;
	materials[4].RefractionCoef = 1.0;
	materials[4].MaterialType = MIRROR_REFLECTION;
	

}

void initializeDefaultScene()
{
	/** TRIANGLES **/
	/* left wall */
	triangles[0].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[0].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[0].v3 = vec3(-5.0, 5.0,-5.0);
	triangles[0].MaterialIdx = 2;

	triangles[1].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[1].v2 = vec3(-5.0,-5.0, 5.0);
	triangles[1].v3 = vec3(-5.0, 5.0, 5.0);
	triangles[1].MaterialIdx = 2;

	/* back wall */
	triangles[2].v1 = vec3(-5.0,-5.0, 5.0);
	triangles[2].v2 = vec3( 5.0,-5.0, 5.0);
	triangles[2].v3 = vec3(-5.0, 5.0, 5.0);
	triangles[2].MaterialIdx = 0;

	triangles[3].v1 = vec3( 5.0, 5.0, 5.0);
	triangles[3].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[3].v3 = vec3( 5.0,-5.0, 5.0);
	triangles[3].MaterialIdx = 0;

	/* right wall */
	triangles[4].v1 = vec3(5.0,-5.0,-5.0);
	triangles[4].v2 = vec3(5.0, 5.0,-5.0);
	triangles[4].v3 = vec3(5.0, 5.0, 5.0);
	triangles[4].MaterialIdx = 0;

	triangles[5].v1 = vec3(5.0,-5.0,-5.0);
	triangles[5].v2 = vec3(5.0, 5.0, 5.0);
	triangles[5].v3 = vec3(5.0,-5.0, 5.0);
	triangles[5].MaterialIdx = 0;

	/* bottom wall */
	triangles[6].v1 = vec3(-5.0, -5.0, -5.0);
	triangles[6].v2 = vec3( 5.0, -5.0, -5.0);
	triangles[6].v3 = vec3(-5.0, -5.0,  5.0);
	triangles[6].MaterialIdx = 0;

	triangles[7].v1 = vec3( 5.0, -5.0, -5.0);
	triangles[7].v2 = vec3( 5.0, -5.0,  5.0);
	triangles[7].v3 = vec3(-5.0, -5.0,  5.0);
	triangles[7].MaterialIdx = 0;

	/* top wall */
	triangles[8].v1 = vec3(-5.0,5.0,-5.0);
	triangles[8].v2 = vec3(-5.0,5.0, 5.0);
	triangles[8].v3 = vec3(5.0,5.0,-5.0);
	triangles[8].MaterialIdx = 0;

	triangles[9].v1 = vec3(5.0,5.0, 5.0);
	triangles[9].v2 = vec3(5.0,5.0,-5.0);
	triangles[9].v3 = vec3(-5.0,5.0, 5.0);
	triangles[9].MaterialIdx = 0;

	/*
	// front wall 
	triangles[10].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[10].v2 = vec3( 5.0, 5.0,-5.0);
	triangles[10].v3 = vec3(-5.0, 5.0,-5.0);
	triangles[10].MaterialIdx = 0;

	triangles[11].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[11].v2 = vec3( 5.0,-5.0,-5.0);
	triangles[11].v3 = vec3( 5.0, 5.0,-5.0);
	triangles[11].MaterialIdx = 0;
	*/
	
	/** SPHERES **/
	spheres[0].Center = vec3(-1.0,-1.0,-2.0);
	spheres[0].Radius = 2.0;
	spheres[0].MaterialIdx = 1;

	spheres[1].Center = vec3(2.0,1.0,2.0);
	spheres[1].Radius = 1.0;
	spheres[1].MaterialIdx = 4;

	spheres[2].Center = vec3(3.3,0.0,-2.0);
	spheres[2].Radius = 1.6;
	spheres[2].MaterialIdx = 3;
}

void initializeDefaultCamera()
{
	//** CAMERA **//
	uCamera.Position = vec3(0.0, 0.0, -9.9);
	uCamera.View = vec3(0.0, 0.0, 1.0);
	uCamera.Up = vec3(0.0, 1.0, 0.0);
	uCamera.Side = vec3(1.0, 0.0, 0.0);
	uCamera.Scale = vec2(1.0);
}

SRay GenerateRay ( SCamera uCamera )
{
	vec2 coords = glPosition.xy * uCamera.Scale;
	vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y;
	return SRay ( uCamera.Position, normalize(direction) );
}

bool IntersectSphere ( SSphere sphere, SRay ray, float start, float final, out float time )
{
	ray.Origin -= sphere.Center;
	float A = dot ( ray.Direction, ray.Direction );
	float B = dot ( ray.Direction, ray.Origin );
	float C = dot ( ray.Origin, ray.Origin ) - sphere.Radius * sphere.Radius;
	float D = B * B - A * C;
	if ( D > 0.0 )
	{
		D = sqrt ( D );
		//time = min ( max ( 0.0, ( -B - D ) / A ), ( -B + D ) / A );
		float t1 = ( -B - D ) / A;
		float t2 = ( -B + D ) / A;
		
		if (t1 < 0 && t2 < 0)
			return false;

		if(min(t1, t2) < 0)
		{
			time = max(t1,t2);
			return true;
		}
		time = min(t1, t2);
		return true;
	}
	return false;
}

bool IntersectTriangle (SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time )
{
	// Compute the intersection of ray with a triangle using geometric solution
	// Input: points v1, v2, v3 are the triangle's vertices
	// rayOrig and rayDir are the ray's origin (point) and the ray's direction ???????????????????
	// Return: return true is the ray intersects the triangle, false otherwise

	// compute plane's normal vector
	time = -1;
	vec3 A = v2 - v1;
	vec3 B = v3 - v1;

	// no need to normalize vector
	vec3 N = cross(A, B); // N

	// Step 1: finding P
	// check if ray and plane are parallel ?
	float NdotRayDirection = dot(N, ray.Direction);

	if (abs(NdotRayDirection) < 0.001)
		return false; // they are parallel so they don't intersect !

	float d = dot(N, v1); // compute d parameter using equation 2

	float t = -(dot(N, ray.Origin) - d) / NdotRayDirection;	// compute t (equation 3)

	// check if the triangle is in behind the ray
	if (t < 0)
		return false; // the triangle is behind
	
	vec3 P = ray.Origin + t * ray.Direction; // compute the intersection point using equation 1

	// Step 2: inside-outside test
	vec3 C;
	// vector perpendicular to triangle's plane
	// edge 1
	vec3 edge1 = v2 - v1;
	vec3 VP1 = P - v1;
	C = cross(edge1, VP1);
	if (dot(N, C) < 0)
		return false; // P is on the right side
	
	// edge 2
	vec3 edge2 = v3 - v2;
	vec3 VP2 = P - v2;
	C = cross(edge2, VP2);
	if (dot(N, C) < 0)
		return false; // P is on the right side
	
	// edge 3
	vec3 edge3 = v1 - v3;
	vec3 VP3 = P - v3;
	C = cross(edge3, VP3);
	if (dot(N, C) < 0)
		return false; // P is on the right side;
	
	time = t;
	return true; // this ray hits the triangle
}

bool Raytrace ( SRay ray, float start, float final, inout SIntersection intersect )
{
	bool result = false;
	float test = start;
	intersect.Time = final;
	//calculate intersect with spheres
	for (int i = 0; i < 3; i++)
	{
		SSphere sphere = spheres[i];
		if ( IntersectSphere (sphere, ray, start, final, test ) && test < intersect.Time )
		{
			intersect.Time = test;
            intersect.Point = ray.Origin + ray.Direction * test;
            intersect.Normal = normalize(intersect.Point - spheres[i].Center);
            intersect.Color = materials[spheres[i].MaterialIdx].Color;
            intersect.LightCoeffs = materials[spheres[i].MaterialIdx].LightCoeffs;
            intersect.ReflectionCoef = materials[spheres[i].MaterialIdx].ReflectionCoef;
            intersect.RefractionCoef = materials[spheres[i].MaterialIdx].RefractionCoef;
            intersect.MaterialType = materials[spheres[i].MaterialIdx].MaterialType;
            result = true;
		}
	}
	//calculate intersect with triangles
	for(int i = 0; i < 10; i++)
	{
		STriangle triangle = triangles[i];
		if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time)
		{
			intersect.Time = test;
            intersect.Point = ray.Origin + ray.Direction * test;
            intersect.Normal = normalize(cross(triangles[i].v1 - triangles[i].v2, triangles[i].v3 - triangles[i].v2));
            intersect.Color = materials[triangles[i].MaterialIdx].Color;
            intersect.LightCoeffs = materials[triangles[i].MaterialIdx].LightCoeffs;
            intersect.ReflectionCoef = materials[triangles[i].MaterialIdx].ReflectionCoef;
            intersect.RefractionCoef = materials[triangles[i].MaterialIdx].RefractionCoef;
            intersect.MaterialType = materials[triangles[i].MaterialIdx].MaterialType;
            result = true;
		}
	}
	return result;
}

vec3 Phong ( SIntersection intersect, SLight currLight, float shadow)
{
	vec3 light = normalize ( currLight.Position - intersect.Point );
	float diffuse = max(dot(light, intersect.Normal), 0.0);
	vec3 view = normalize(uCamera.Position - intersect.Point);
	vec3 reflected= reflect( -view, intersect.Normal );
	float specular = pow(max(dot(reflected, light), 0.0), intersect.LightCoeffs.w);

	return intersect.LightCoeffs.x * intersect.Color + intersect.LightCoeffs.y * diffuse * intersect.Color * shadow + intersect.LightCoeffs.z * specular * Unit;
}

float Shadow(SLight currLight, SIntersection intersect)
{
	// Point is lighted
	float shadowing = 1.0;
	// Vector to the light source
	vec3 direction = normalize(currLight.Position - intersect.Point);
	// Distance to the light source
	float distanceLight = distance(currLight.Position, intersect.Point);
	// Generation shadow ray for this light source
	SRay shadowRay = SRay(intersect.Point + direction * EPSILON, direction);
	// ...test intersection this ray with each scene object
	SIntersection shadowIntersect;
	shadowIntersect.Time = BIG;
	// trace ray from shadow ray begining to light source position
	if(Raytrace(shadowRay, 0, distanceLight, shadowIntersect))
	{
		// this light source is invisible in the intercection point
		shadowing = 0.0;
	}
	return shadowing;
}

bool isEmpty() 
{
	return stack.top < 0;
}

STracingRay popRay() 
{
	return stack.container[stack.top--];
}

void pushRay(STracingRay t_ray) // temporary ray
{
	if (stack.top == STACK_SIZE - 1) return;
	stack.container[stack.top + 1] = t_ray;
	stack.top++;
}

void main ( void ) 
{
	stack.top = -1;
	float start = 0;
	float final = BIG;

	initializeDefaultCamera();
	SRay ray = GenerateRay( uCamera);
	SIntersection intersect;
	intersect.Time = BIG;
	vec3 resultColor = vec3(0,0,0);
	initializeDefaultLightMaterials();
	initializeDefaultScene();

	STracingRay trRay = STracingRay(ray, 1, 0);
	pushRay(trRay);
	while(!isEmpty())
	{
		STracingRay trRay = popRay();
		ray = trRay.ray;
		SIntersection intersect;
		intersect.Time = BIG;
		start = 0;
		final = BIG;
		if (Raytrace(ray, start, final, intersect))
		{
			switch(intersect.MaterialType)
			{
			case DIFFUSE_REFLECTION:
			{
				float shadowing = Shadow(uLight, intersect);
				resultColor += trRay.contribution * Phong ( intersect, uLight, shadowing );
				break;
			}
			case MIRROR_REFLECTION:
			{
				if(intersect.ReflectionCoef < 1)
				{
				float contribution = trRay.contribution * (1 - intersect.ReflectionCoef);
				float shadowing = Shadow(uLight, intersect);
				resultColor += contribution * Phong(intersect, uLight, shadowing);
				}
				vec3 reflectDirection = reflect(ray.Direction, intersect.Normal);
				// creare reflection ray
				float contribution = trRay.contribution * intersect.ReflectionCoef;
				STracingRay reflectRay = STracingRay(
				SRay(intersect.Point + reflectDirection * EPSILON,
				reflectDirection),
				contribution, trRay.depth + 1);
				pushRay(reflectRay);
				break;
			}
			} // switch
		} // if (Raytrace(ray, start, final, intersect))
	} // while(!isEmpty())

	FragColor = vec4 (resultColor, 1.0);

}
