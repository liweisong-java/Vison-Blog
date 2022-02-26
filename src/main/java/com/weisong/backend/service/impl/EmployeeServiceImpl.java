package com.weisong.backend.service.impl;

import com.github.pagehelper.PageInfo;
import com.weisong.backend.entities.Employee;
import com.weisong.backend.mapper.EmployeeMapper;
import com.weisong.backend.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author 李伟松
 * @create 2022-02-16-19:37
 */
@Service
public class EmployeeServiceImpl implements EmployeeService {

    @Autowired
    EmployeeMapper employeeMapper;

    @Override
    public List<Employee> getAllEmp() {
        List<Employee> allEmp = employeeMapper.getAllEmp();
        allEmp.forEach((item)->{
            item.setIsEnable(item.getEnableEnum() == 1);
        });
        return allEmp;
    }

    @Override
    public Integer getEnableById(Integer emp_Id) {
        Integer enableById = employeeMapper.getEnableById(emp_Id);
        return enableById;
    }

    @Override
    public void insertEmp(Employee employee) {
        employeeMapper.insertEmp(employee.getLastName(), employee.getEmail(), employee.getGender(), employee.getDepartmentName(), employee.getBirth(), 1);
    }

    @Override
    public void deleteEmpById(Integer emp_Id) {
        employeeMapper.deleteEmpById(emp_Id);
    }

    @Override
    public Boolean changeEnableById(Integer emp_Id) {
        Integer enableById = this.getEnableById(emp_Id);
        return employeeMapper.changeEnableById(emp_Id,enableById == 0 ? 1 : 0);
    }

    @Override
    public Boolean checkUser(String lastName) {
        return employeeMapper.checkUser(lastName) == null ? true : false;
    }

}
