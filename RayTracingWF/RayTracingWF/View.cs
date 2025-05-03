using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OpenTK.Audio.OpenAL;
using OpenTK.Graphics.OpenGL;
using OpenTK;
using OpenTK.Mathematics;
using System.Windows.Forms;


namespace RayTracingWF
{
    class View
    {
        public int BasicProgramID;

        int width, height;
        public int vbo_position;
        public int attribute_vpos;
        int uniform_pos;
        int uniform_aspect;
        Vector3 campos;
        Vector3 aspect;

        void loadShader(String filename, ShaderType type, int program)
        {
            int address = GL.CreateShader(type);
            using (System.IO.StreamReader sr = new StreamReader(filename))
            {
                GL.ShaderSource(address, sr.ReadToEnd());
            }
            GL.CompileShader(address);
            GL.AttachShader(program, address);
            Console.WriteLine(GL.GetShaderInfoLog(address));
        }

        public void InitShaders()
        {
            BasicProgramID = GL.CreateProgram();
            loadShader("../../../Shaders/raytracing.vert", ShaderType.VertexShader, BasicProgramID);
            loadShader("../../../Shaders/raytracing.frag", ShaderType.FragmentShader, BasicProgramID);
            GL.LinkProgram(BasicProgramID);

            // success check
            int status = 0;
            GL.GetProgram(BasicProgramID, GetProgramParameterName.LinkStatus, out status);
            Console.WriteLine(GL.GetProgramInfoLog(BasicProgramID));
        }
        
        public void BufferObject()
        {
            campos = new Vector3(2f, 2f, 2f);// Добавить эту строку
            aspect = new Vector3(1f, 1f, 0f);// Добавить эту строку
            attribute_vpos = GL.GetAttribLocation(BasicProgramID, "vPosition"); // Добавить эту строку
            uniform_pos = GL.GetUniformLocation(BasicProgramID, "campos"); // Добавить эту строку
            uniform_aspect = GL.GetUniformLocation(BasicProgramID, "aspect"); // Добавить эту строку
            Vector3[] vertdata = new Vector3[]
             {
                new Vector3(-1f, -1f, 0f),
                new Vector3( 1f, -1f, 0f),
                new Vector3( 1f, 1f, 0f),
                new Vector3(-1f, 1f, 0f)
             };
            GL.GenBuffers(1, out vbo_position);
            GL.BindBuffer(BufferTarget.ArrayBuffer, vbo_position);
            GL.BufferData<Vector3>(BufferTarget.ArrayBuffer, (IntPtr)(vertdata.Length * Vector3.SizeInBytes), vertdata, BufferUsageHint.StaticDraw);
            GL.VertexAttribPointer(attribute_vpos, 3, VertexAttribPointerType.Float, false, 0, 0);
            GL.EnableVertexAttribArray(attribute_vpos);  // Добавить эту строку
            GL.Uniform3(uniform_pos, campos);
            GL.Uniform3(uniform_aspect, aspect);
            GL.UseProgram(BasicProgramID);
            GL.BindBuffer(BufferTarget.ArrayBuffer, 0);
        }

/*        public void SetupView(int width, int height)
        {
            this.width = width;
            this.height = height;
            aspect = (float)width / height;

            vertdata = new Vector3[] {
                new Vector3(-1f, -1f, 0f),
                new Vector3( 1f, -1f, 0f),
                new Vector3( 1f,  1f, 0f),
                new Vector3(-1f,  1f, 0f)
            };

            InitShaders();

            attribute_vpos = GL.GetAttribLocation(BasicProgramID, "vPosition");
            uniform_pos = GL.GetUniformLocation(BasicProgramID, "campos");
            uniform_aspect = GL.GetUniformLocation(BasicProgramID, "aspect");

            GL.GenVertexArrays(1, out vao);
            GL.BindVertexArray(vao);

            GL.GenBuffers(1, out vbo_position);
            GL.BindBuffer(BufferTarget.ArrayBuffer, vbo_position);
            GL.BufferData<Vector3>(BufferTarget.ArrayBuffer, (IntPtr)(vertdata.Length *
            Vector3.SizeInBytes), vertdata, BufferUsageHint.StaticDraw);
            GL.VertexAttribPointer(attribute_vpos, 3, VertexAttribPointerType.Float, false, 0, 0);
            GL.EnableVertexAttribArray(attribute_vpos);
            Vector3 campos = new Vector3(2f, 2f, 2f);
            GL.Uniform3(uniform_pos, campos);
            GL.Uniform1(uniform_aspect, aspect);

            GL.UseProgram(BasicProgramID);
            GL.BindVertexArray(0);
            GL.BindBuffer(BufferTarget.ArrayBuffer, 0);
        }*/

        public Matrix4 GetProjection()
        {
            Matrix4 res = Matrix4.CreatePerspectiveFieldOfView(MathHelper.DegreesToRadians(60.0f), width / height, 0.1f, 100.0f);
            return res;
        }

        public void LoadShader()
        {
            BasicProgramID = GL.CreateProgram();
            int vertexShader = GL.CreateShader(ShaderType.VertexShader);
            GL.ShaderSource(vertexShader, "../../../Shaders/raytracing.vert");
            GL.CompileShader(vertexShader);
            GL.GetShader(vertexShader, ShaderParameter.CompileStatus, out int success1);
            if (success1 == 0)
            {
                string infoLog = GL.GetShaderInfoLog(vertexShader);
                Console.WriteLine(infoLog);
            }
            int fragmentShader = GL.CreateShader(ShaderType.FragmentShader);
            GL.ShaderSource(fragmentShader, "../../../Shaders/raytracing.frag");
            GL.CompileShader(fragmentShader);
            GL.GetShader(fragmentShader, ShaderParameter.CompileStatus, out int success2);
            if (success2 == 0)
            {
                string infoLog = GL.GetShaderInfoLog(fragmentShader);
                Console.WriteLine(infoLog);
            }
            GL.AttachShader(BasicProgramID, vertexShader);
            GL.AttachShader(BasicProgramID, fragmentShader);
            GL.LinkProgram(BasicProgramID);
        }

    }
}
