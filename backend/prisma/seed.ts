import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    // System
    ['users', 'create'],
    ['users', 'read'],
    ['users', 'update'],
    ['users', 'delete'],

    ['roles', 'create'],
    ['roles', 'read'],
    ['roles', 'update'],
    ['roles', 'delete'],

    ['companies', 'create'],
    ['companies', 'read'],
    ['companies', 'update'],
    ['companies', 'delete'],

    ['projects', 'create'],
    ['projects', 'read'],
    ['projects', 'update'],
    ['projects', 'delete'],

    ['dashboard', 'read'],
    ['audit_logs', 'read'],

    // Future modules
    ['planning', 'manage'],
    ['cost', 'manage'],
    ['procurement', 'manage'],
    ['inventory', 'manage'],
    ['contracts', 'manage'],
    ['documents', 'manage'],
    ['quality', 'manage'],
    ['safety', 'manage'],
    ['hr', 'manage'],
    ['equipment', 'manage'],
    ['finance', 'manage'],
    ['reports', 'read'],
  ];

  for (const [module, action] of permissions) {
    await prisma.permission.upsert({
      where: {
        module_action: {
          module,
          action,
        },
      },
      update: {},
      create: {
        module,
        action,
        description: `${action} ${module}`,
      },
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full system administrator',
      isSystem: true,
    },
  });

  const projectManagerRole = await prisma.role.upsert({
    where: { name: 'Project Manager' },
    update: {},
    create: {
      name: 'Project Manager',
      description: 'Manages projects, schedules, documents, and reports',
      isSystem: true,
    },
  });

  const engineerRole = await prisma.role.upsert({
    where: { name: 'Engineer' },
    update: {},
    create: {
      name: 'Engineer',
      description: 'Handles site records, documents, inspections, and reports',
      isSystem: true,
    },
  });

  const accountantRole = await prisma.role.upsert({
    where: { name: 'Accountant' },
    update: {},
    create: {
      name: 'Accountant',
      description: 'Handles cost, invoices, payments, and financial reports',
      isSystem: true,
    },
  });

  const clientRole = await prisma.role.upsert({
    where: { name: 'Client' },
    update: {},
    create: {
      name: 'Client',
      description: 'Client portal access',
      isSystem: true,
    },
  });

  const supplierRole = await prisma.role.upsert({
    where: { name: 'Supplier' },
    update: {},
    create: {
      name: 'Supplier',
      description: 'Supplier and procurement access',
      isSystem: true,
    },
  });

  const contractorRole = await prisma.role.upsert({
    where: { name: 'Contractor' },
    update: {},
    create: {
      name: 'Contractor',
      description: 'Subcontractor project access',
      isSystem: true,
    },
  });

  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const projectManagerPermissions = allPermissions.filter((p) =>
    [
      'projects',
      'dashboard',
      'planning',
      'documents',
      'quality',
      'safety',
      'reports',
      'audit_logs',
    ].includes(p.module),
  );

  for (const permission of projectManagerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: projectManagerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: projectManagerRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('Seed completed successfully');
  console.log({
    roles: [
      adminRole.name,
      projectManagerRole.name,
      engineerRole.name,
      accountantRole.name,
      clientRole.name,
      supplierRole.name,
      contractorRole.name,
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });