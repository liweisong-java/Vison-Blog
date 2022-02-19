package com.weisong.backend.service.impl;

import com.weisong.backend.entities.Department;
import com.weisong.backend.entities.Employee;
import com.weisong.backend.mapper.DepartmentMapper;
import com.weisong.backend.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-17-19:21
 */
@Service
public class DepartmentServiceImpl implements DepartmentService {

    @Autowired
    DepartmentMapper departmentMapper;


    public List<Department> getAllDept() {
        return departmentMapper.getAllDept();

    }

    @Override
    public Long insertDept(Department department) {
        return departmentMapper.insertDept(department.getDepartmentName());
    }

}
