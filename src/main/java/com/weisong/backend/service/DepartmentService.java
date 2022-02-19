package com.weisong.backend.service;

import com.weisong.backend.entities.Department;
import com.weisong.backend.entities.Employee;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-17-19:20
 */
public interface DepartmentService {

    List<Department> getAllDept();

    Long insertDept(Department department);
}
